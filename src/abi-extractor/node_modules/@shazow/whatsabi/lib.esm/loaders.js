/**
 * @module loaders
 * @example
 * Verified contract source code:
 * ```ts
 * const loader = whatsabi.loaders.defaultsWithEnv(env);
 * const result = await loader.getContract(address);
 * const sources = await result.getSources();
 *
 * for (const s of sources) {
 *   console.log(s.path, " -> ", s.content + "...");
 * }
 * ```
 *
 * @example
 * Combine loaders with custom settings behind a single interface, or use {@link defaultsWithEnv} as a shortcut for this.
 * ```ts
 * const loader = new whatsabi.loaders.MultiABILoader([
 *   new whatsabi.loaders.SourcifyABILoader({ chainId: 8453 }),
 *   new whatsabi.loaders.EtherscanABILoader({
 *     baseURL: "https://api.basescan.org/api",
 *     apiKey: "...", // Replace the value with your API key
 *   }),
 * ]);
 * ```
 */
import { fetchJSON } from "./utils.js";
import * as errors from "./errors.js";
const emptyContractResult = {
    ok: false,
    abi: [],
    name: null,
    evmVersion: "",
    compilerVersion: "",
    runs: 0,
};
/** Load ABIs from multiple providers until a result is found. */
export class MultiABILoader {
    name = "MultiABILoader";
    loaders;
    /// Note: This callback is used to pull out which loader succeeded without modifying the return API.
    /// We can remove it once we switch to using getContract for autoload.
    /// @internal
    onLoad;
    constructor(loaders) {
        this.loaders = loaders;
    }
    async getContract(address) {
        for (const loader of this.loaders) {
            try {
                const r = await loader.getContract(address);
                if (r && r.abi.length > 0) {
                    if (this.onLoad)
                        this.onLoad(loader);
                    return r;
                }
            }
            catch (err) {
                if (err.cause?.status === 404)
                    continue;
                throw new MultiABILoaderError("MultiABILoader getContract error: " + err.message, {
                    context: { loader, address },
                    cause: err,
                });
            }
        }
        return emptyContractResult;
    }
    async loadABI(address) {
        for (const loader of this.loaders) {
            try {
                const r = await loader.loadABI(address);
                // Return the first non-empty result
                if (r.length > 0) {
                    if (this.onLoad)
                        this.onLoad(loader);
                    return r;
                }
            }
            catch (err) {
                if (err.cause?.status === 404)
                    continue;
                throw new MultiABILoaderError("MultiABILoader loadABI error: " + err.message, {
                    context: { loader, address },
                    cause: err,
                });
            }
        }
        return [];
    }
}
export class MultiABILoaderError extends errors.LoaderError {
}
;
/** Etherscan v1 API loader */
export class EtherscanABILoader {
    name = "EtherscanABILoader";
    apiKey;
    baseURL;
    constructor(config) {
        if (config === undefined)
            config = {};
        this.apiKey = config.apiKey;
        this.baseURL = config.baseURL || "https://api.etherscan.io/api";
    }
    /** Etherscan helper for converting the encoded SourceCode result arg to a decoded ContractSources. */
    #toContractSources(result) {
        if (!result.SourceCode.startsWith("{{")) {
            return [{ content: result.SourceCode }];
        }
        // Etherscan adds an extra {} to the encoded JSON
        const s = JSON.parse(result.SourceCode.slice(1, result.SourceCode.length - 1));
        // Flatten sources
        // { "sources": {"foo.sol": {"content": "..."}}}
        const sources = s.sources;
        return Object.entries(sources).map(([path, source]) => {
            return { path, content: source.content };
        });
    }
    async getContract(address) {
        const url = new URL(this.baseURL);
        const params = {
            module: "contract",
            action: "getsourcecode",
            address: address,
            ...(this.apiKey && { apikey: this.apiKey }),
        };
        // Using .set() to overwrite any default values that may be present in baseURL
        Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
        try {
            const r = await fetchJSON(url.toString());
            if (r.status === "0") {
                if (r.result === "Contract source code not verified")
                    return emptyContractResult;
                throw new Error(r.result); // This gets wrapped below
            }
            // Status 1 means success, but the result could still be empty
            if (r.result.length > 0 && r.result[0].ABI === "Contract source code not verified") {
                return emptyContractResult;
            }
            const result = r.result[0];
            return {
                abi: JSON.parse(result.ABI),
                name: result.ContractName,
                evmVersion: result.EVMVersion,
                compilerVersion: result.CompilerVersion,
                runs: result.Runs,
                getSources: async () => {
                    try {
                        return this.#toContractSources(result);
                    }
                    catch (err) {
                        throw new EtherscanABILoaderError("EtherscanABILoader getContract getSources error: " + err.message, {
                            context: { url, address },
                            cause: err,
                        });
                    }
                },
                ok: true,
                loader: this,
                loaderResult: result,
            };
        }
        catch (err) {
            throw new EtherscanABILoaderError("EtherscanABILoader getContract error: " + err.message, {
                context: { url, address },
                cause: err,
            });
        }
    }
    async loadABI(address) {
        const url = new URL(this.baseURL);
        const params = {
            module: "contract",
            action: "getabi",
            address: address,
            ...(this.apiKey && { apikey: this.apiKey }),
        };
        // Using .set() to overwrite any default values that may be present in baseURL
        Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
        try {
            const r = await fetchJSON(url.toString());
            if (r.status === "0") {
                if (r.result === "Contract source code not verified")
                    return [];
                throw new Error(r.result); // This gets wrapped below
            }
            return JSON.parse(r.result);
        }
        catch (err) {
            throw new EtherscanABILoaderError("EtherscanABILoader loadABI error: " + err.message, {
                context: { url, address },
                cause: err,
            });
        }
    }
}
export class EtherscanABILoaderError extends errors.LoaderError {
}
;
/** Etherscan v2 API loader */
export class EtherscanV2ABILoader extends EtherscanABILoader {
    name = "EtherscanV2ABILoader";
    constructor(config) {
        // chainId is a required parameter in v2, as is an API key
        super({ apiKey: config.apiKey, baseURL: `https://api.etherscan.io/v2/api?chainid=${config?.chainId ?? 1}` });
    }
}
function isSourcifyNotFound(error) {
    return (
    // Sourcify returns strict CORS only if there is no result -_-
    error.message === "Failed to fetch" ||
        error.status === 404);
}
// https://sourcify.dev/
export class SourcifyABILoader {
    name = "SourcifyABILoader";
    chainId;
    constructor(config) {
        this.chainId = config?.chainId ?? 1;
    }
    static stripPathPrefix(path) {
        return path.replace(/^\/contracts\/(full|partial)_match\/\d*\/\w*\/(sources\/)?/, "");
    }
    async #loadContract(url) {
        try {
            const r = await fetchJSON(url);
            const files = r.files ?? r;
            // Metadata is usually the first one
            const metadata = files.find((f) => f.name === "metadata.json");
            if (metadata === undefined)
                throw new SourcifyABILoaderError("metadata.json not found");
            // Note: Sometimes metadata.json contains sources, but not always. So we can't rely on just the metadata.json
            const m = JSON.parse(metadata.content);
            // Sourcify includes a title from the Natspec comments
            let name = m.output.devdoc?.title;
            if (!name && m.settings.compilationTarget) {
                // Try to use the compilation target name as a fallback
                const targetNames = Object.values(m.settings.compilationTarget);
                if (targetNames.length > 0) {
                    name = targetNames[0];
                }
            }
            return {
                abi: m.output.abi,
                name: name ?? null,
                evmVersion: m.settings.evmVersion,
                compilerVersion: m.compiler.version,
                runs: m.settings.optimizer.runs,
                // TODO: Paths will have a sourcify prefix, do we want to strip it to help normalize? It doesn't break anything keeping the prefix, so not sure.
                // E.g. /contracts/full_match/1/0x1F98431c8aD98523631AE4a59f267346ea31F984/sources/contracts/interfaces/IERC20Minimal.sol
                // Can use stripPathPrefix helper to do this, but maybe we want something like getSources({ normalize: true })?
                getSources: async () => files.map(({ path, content }) => { return { path, content }; }),
                ok: true,
                loader: this,
                loaderResult: m,
            };
        }
        catch (err) {
            if (isSourcifyNotFound(err))
                return emptyContractResult;
            throw new SourcifyABILoaderError("SourcifyABILoader load contract error: " + err.message, {
                context: { url },
                cause: err,
            });
        }
    }
    async getContract(address) {
        {
            // Full match index includes verification settings that matches exactly
            const url = "https://sourcify.dev/server/files/" + this.chainId + "/" + address;
            const r = await this.#loadContract(url);
            if (r.ok)
                return r;
        }
        {
            // Partial match index is for verified contracts whose settings didn't match exactly
            const url = "https://sourcify.dev/server/files/any/" + this.chainId + "/" + address;
            const r = await this.#loadContract(url);
            if (r.ok)
                return r;
        }
        return emptyContractResult;
    }
    async loadABI(address) {
        {
            // Full match index includes verification settings that matches exactly
            const url = "https://sourcify.dev/server/repository/contracts/full_match/" + this.chainId + "/" + address + "/metadata.json";
            try {
                return (await fetchJSON(url)).output.abi;
            }
            catch (err) {
                if (!isSourcifyNotFound(err)) {
                    throw new SourcifyABILoaderError("SourcifyABILoader loadABI error: " + err.message, {
                        context: { address, url },
                        cause: err,
                    });
                }
            }
        }
        {
            // Partial match index is for verified contracts whose settings didn't match exactly
            const url = "https://sourcify.dev/server/repository/contracts/partial_match/" + this.chainId + "/" + address + "/metadata.json";
            try {
                return (await fetchJSON(url)).output.abi;
            }
            catch (err) {
                if (!isSourcifyNotFound(err)) {
                    throw new SourcifyABILoaderError("SourcifyABILoader loadABI error: " + err.message, {
                        context: { address, url },
                        cause: err,
                    });
                }
            }
        }
        return [];
    }
}
export class SourcifyABILoaderError extends errors.LoaderError {
}
;
/** Blockscout API loader: https://docs.blockscout.com/ */
export class BlockscoutABILoader {
    name = "BlockscoutABILoader";
    apiKey;
    baseURL;
    constructor(config) {
        if (config === undefined)
            config = {};
        this.apiKey = config.apiKey;
        this.baseURL = config.baseURL || "https://eth.blockscout.com/api";
    }
    /** Blockscout helper for converting the result arg to a decoded ContractSources. */
    #toContractSources(result) {
        const sources = [];
        if (result.source_code) {
            sources.push({
                path: result.file_path,
                content: result.source_code,
            });
        }
        result.additional_sources?.forEach((source) => {
            sources.push({
                path: source.file_path,
                content: source.source_code,
            });
        });
        return sources;
    }
    async getContract(address) {
        let url = this.baseURL + `/v2/smart-contracts/${address}`;
        if (this.apiKey)
            url += "?apikey=" + this.apiKey;
        try {
            const r = await fetch(url);
            const result = (await r.json());
            if (!result.abi ||
                !result.name ||
                !result.compiler_version ||
                !result.source_code) {
                return emptyContractResult;
            }
            return {
                abi: result.abi,
                name: result.name,
                evmVersion: result.evm_version || "",
                compilerVersion: result.compiler_version,
                runs: result.optimization_runs || 200,
                getSources: async () => {
                    try {
                        return this.#toContractSources(result);
                    }
                    catch (err) {
                        throw new BlockscoutABILoaderError("BlockscoutABILoader getContract getSources error: " +
                            err.message, {
                            context: { url, address },
                            cause: err,
                        });
                    }
                },
                ok: true,
                loader: this,
                loaderResult: result,
            };
        }
        catch (err) {
            throw new BlockscoutABILoaderError("BlockscoutABILoader getContract error: " + err.message, {
                context: { url, address },
                cause: err,
            });
        }
    }
    async loadABI(address) {
        let url = this.baseURL + `/v2/smart-contracts/${address}`;
        if (this.apiKey)
            url += "?apikey=" + this.apiKey;
        try {
            const r = await fetch(url);
            const result = (await r.json());
            if (!result.abi) {
                return [];
            }
            return result.abi;
        }
        catch (err) {
            throw new BlockscoutABILoaderError("BlockscoutABILoader loadABI error: " + err.message, {
                context: { url, address },
                cause: err,
            });
        }
    }
}
export class BlockscoutABILoaderError extends errors.LoaderError {
}
function isAnyABINotFound(error) {
    return (error.status === 404 ||
        // "ABI not found" or "Not found"
        /not found/i.test(error.message));
}
/** https://anyabi.xyz/ */
export class AnyABILoader {
    name = "AnyABILoader";
    chainId;
    constructor(config) {
        this.chainId = config?.chainId ?? 1;
    }
    async #fetchAnyABI(address) {
        const url = "https://anyabi.xyz/api/get-abi/" + this.chainId + "/" + address;
        try {
            const r = await fetchJSON(url);
            const { abi, name } = r;
            return {
                abi: abi,
                name: name,
                ok: true,
                loader: this,
                loaderResult: r,
            };
        }
        catch (err) {
            if (isAnyABINotFound(err))
                return emptyContractResult;
            throw new AnyABILoaderError("AnyABILoader load contract error: " + err.message, {
                context: { url },
                cause: err,
            });
        }
    }
    async getContract(address) {
        {
            const r = await this.#fetchAnyABI(address);
            if (r.ok)
                return r;
        }
        return emptyContractResult;
    }
    async loadABI(address) {
        {
            const r = await this.#fetchAnyABI(address);
            if (r.ok)
                return r.abi;
        }
        return [];
    }
}
export class AnyABILoaderError extends errors.LoaderError {
}
;
// Load signatures from multiple providers until a result is found.
export class MultiSignatureLookup {
    lookups;
    constructor(lookups) {
        this.lookups = lookups;
    }
    async loadFunctions(selector) {
        for (const lookup of this.lookups) {
            const r = await lookup.loadFunctions(selector);
            // Return the first non-empty result
            if (r.length > 0)
                return r;
        }
        return [];
    }
    async loadEvents(hash) {
        for (const lookup of this.lookups) {
            const r = await lookup.loadEvents(hash);
            // Return the first non-empty result
            if (r.length > 0)
                return r;
        }
        return [];
    }
}
/** https://www.4byte.directory/ */
export class FourByteSignatureLookup {
    async load(url) {
        try {
            const r = await fetchJSON(url);
            if (r.results === undefined)
                return [];
            return r.results.map((r) => { return r.text_signature; });
        }
        catch (err) {
            if (err.status === 404)
                return [];
            throw new FourByteSignatureLookupError("FourByteSignatureLookup load error: " + err.message, {
                context: { url },
                cause: err,
            });
        }
    }
    async loadFunctions(selector) {
        // Note: Could also lookup directly on Github, but not sure that's a good idea
        return this.load("https://www.4byte.directory/api/v1/signatures/?hex_signature=" + selector);
    }
    async loadEvents(hash) {
        return this.load("https://www.4byte.directory/api/v1/event-signatures/?hex_signature=" + hash);
    }
}
export class FourByteSignatureLookupError extends errors.LoaderError {
}
;
/**
 * https://openchain.xyz/
 * Formerly: https://sig.eth.samczsun.com/
 */
export class OpenChainSignatureLookup {
    async load(url) {
        try {
            const r = await fetchJSON(url);
            if (!r.ok)
                throw new Error("OpenChain API bad response: " + JSON.stringify(r));
            return r;
        }
        catch (err) {
            if (err.status === 404)
                return [];
            throw new OpenChainSignatureLookupError("OpenChainSignatureLookup load error: " + err.message, {
                context: { url },
                cause: err,
            });
        }
    }
    async loadFunctions(selector) {
        const r = await this.load("https://api.openchain.xyz/signature-database/v1/lookup?function=" + selector);
        return (r.result.function[selector] || []).map((item) => item.name);
    }
    async loadEvents(hash) {
        const r = await this.load("https://api.openchain.xyz/signature-database/v1/lookup?event=" + hash);
        return (r.result.event[hash] || []).map((item) => item.name);
    }
}
export class OpenChainSignatureLookupError extends errors.LoaderError {
}
;
export class SamczunSignatureLookup extends OpenChainSignatureLookup {
}
export const defaultABILoader = new MultiABILoader([new SourcifyABILoader(), new EtherscanABILoader()]);
export const defaultSignatureLookup = new MultiSignatureLookup([new OpenChainSignatureLookup(), new FourByteSignatureLookup()]);
/**
 * Return params to use with whatsabi.autoload(...)
 *
 * @example
 * ```ts
 * whatsabi.autoload(address, {provider, ...whatsabi.loaders.defaultsWithEnv(process.env)})
 * ```
 *
 * @example
 * ```ts
 * whatsabi.autoload(address, {
 *     provider,
 *     ...whatsabi.loaders.defaultsWithEnv({
 *         SOURCIFY_CHAIN_ID: 42161,
 *         ETHERSCAN_BASE_URL: "https://api.arbiscan.io/api",
 *         ETHERSCAN_API_KEY: "MYSECRETAPIKEY",
 *     }),
 * })
 * ```
 *
 * @example
 * Can be useful for stand-alone usage too!
 * ```ts
 * const { abiLoader, signatureLookup } = whatsabi.loaders.defaultsWithEnv(env);
 * ```
 */
export function defaultsWithEnv(env) {
    return {
        abiLoader: new MultiABILoader([
            new SourcifyABILoader({ chainId: env.SOURCIFY_CHAIN_ID && Number(env.SOURCIFY_CHAIN_ID) || undefined }),
            new EtherscanABILoader({ apiKey: env.ETHERSCAN_API_KEY, baseURL: env.ETHERSCAN_BASE_URL }),
        ]),
        signatureLookup: new MultiSignatureLookup([
            new OpenChainSignatureLookup(),
            new FourByteSignatureLookup(),
        ]),
    };
}
//# sourceMappingURL=loaders.js.map