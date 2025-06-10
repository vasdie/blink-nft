import * as errors from "./errors.js";
export type ContractResult = {
    abi: any[];
    name: string | null;
    ok: boolean;
    evmVersion?: string;
    compilerVersion?: string;
    runs?: number;
    /**
     * getSources returns the imports -> source code mapping for the contract, if available.
     *
     * Caveats:
     * - Not all loaders support this, so the property could be undefined.
     * - This call could trigger additional fetch requests, depending on the loader.
     **/
    getSources?: () => Promise<ContractSources>;
    /**
     * Loader that provided the result.
     * We can make assumptions about the verified status if a verifying loader returned the result.
     */
    loader?: ABILoader;
    /**
     * Contains the full result from the loader provder.
     * There are no stability guarantees for the data layout of the result, so it's marked as experimental.
     *
     * Any useful attributes that can be normalized across loaders should be uplifted into ContractResult.
     * Please open an issue if you end up relying on rawResponse for properties that should be uplifted.
     *
     * @experimental
     */
    loaderResult?: EtherscanContractResult | SourcifyContractMetadata | any;
};
/**
 * ContractSources is a list of source files.
 * If the source was flattened, it will lack a path attribute.
 *
 * @example
 * ```typescript
 * [{"content": "pragma solidity =0.7.6;\n\nimport ..."}]
 * ```
 *
 * @example
 * ```typescript
 * [{"path": "contracts/Foo.sol", "content:" "pragma solidity =0.7.6;\n\nimport ..."}]
 * ```
 **/
export type ContractSources = Array<{
    path?: string;
    content: string;
}>;
export interface ABILoader {
    readonly name: string;
    loadABI(address: string): Promise<any[]>;
    getContract(address: string): Promise<ContractResult>;
}
/** Load ABIs from multiple providers until a result is found. */
export declare class MultiABILoader implements ABILoader {
    readonly name: string;
    loaders: ABILoader[];
    onLoad?: (loader: ABILoader) => void;
    constructor(loaders: ABILoader[]);
    getContract(address: string): Promise<ContractResult>;
    loadABI(address: string): Promise<any[]>;
}
export declare class MultiABILoaderError extends errors.LoaderError {
}
/** Etherscan v1 API loader */
export declare class EtherscanABILoader implements ABILoader {
    #private;
    readonly name: string;
    apiKey?: string;
    baseURL: string;
    constructor(config?: {
        apiKey?: string;
        baseURL?: string;
    });
    getContract(address: string): Promise<ContractResult>;
    loadABI(address: string): Promise<any[]>;
}
export declare class EtherscanABILoaderError extends errors.LoaderError {
}
export type EtherscanContractResult = {
    SourceCode: string;
    ABI: string;
    ContractName: string;
    CompilerVersion: string;
    OptimizationUsed: number;
    Runs: number;
    ConstructorArguments: string;
    EVMVersion: string;
    Library: string;
    LicenseType: string;
    Proxy: "1" | "0";
    Implementation: string;
    SwarmSource: string;
};
/** Etherscan v2 API loader */
export declare class EtherscanV2ABILoader extends EtherscanABILoader {
    readonly name: string;
    constructor(config: {
        apiKey: string;
        chainId?: number;
    });
}
export declare class SourcifyABILoader implements ABILoader {
    #private;
    readonly name = "SourcifyABILoader";
    chainId?: number;
    constructor(config?: {
        chainId?: number;
    });
    static stripPathPrefix(path: string): string;
    getContract(address: string): Promise<ContractResult>;
    loadABI(address: string): Promise<any[]>;
}
export declare class SourcifyABILoaderError extends errors.LoaderError {
}
export interface SourcifyContractMetadata {
    compiler: {
        version: string;
    };
    language: string;
    output: {
        abi: any[];
        devdoc?: any;
        userdoc?: any;
    };
    settings: {
        compilationTarget: Record<string, string>;
        evmVersion: string;
        libraries: Record<string, string>;
        metadata: Record<string, string>;
        optimizer: any;
        remappings: string[];
    };
    sources: Record<string, any>;
    version: number;
}
/** Blockscout API loader: https://docs.blockscout.com/ */
export declare class BlockscoutABILoader implements ABILoader {
    #private;
    readonly name = "BlockscoutABILoader";
    apiKey?: string;
    baseURL: string;
    constructor(config?: {
        apiKey?: string;
        baseURL?: string;
    });
    getContract(address: string): Promise<ContractResult>;
    loadABI(address: string): Promise<any[]>;
}
export declare class BlockscoutABILoaderError extends errors.LoaderError {
}
export type BlockscoutContractResult = {
    name?: string;
    language?: string;
    license_type?: string;
    is_verified?: boolean;
    is_fully_verified?: boolean;
    is_partially_verified?: boolean;
    is_verified_via_sourcify?: boolean;
    is_verified_via_eth_bytecode_db?: boolean;
    verified_twin_address_hash?: string;
    certified?: boolean;
    source_code?: string;
    source_code_html?: string;
    file_path?: string;
    file_path_html?: string;
    additional_sources?: Array<{
        file_path: string;
        source_code: string;
    }>;
    sourcify_repo_url?: string | null;
    creation_bytecode?: string;
    deployed_bytecode?: string;
    is_changed_bytecode?: boolean;
    is_self_destructed?: boolean;
    abi?: any[];
    has_methods_read?: boolean;
    has_methods_write?: boolean;
    has_custom_methods_read?: boolean;
    has_custom_methods_write?: boolean;
    can_be_visualized_via_sol2uml?: boolean;
    constructor_args?: string;
    decoded_constructor_args?: any[];
    compiler_version?: string;
    compiler_settings?: any;
    evm_version?: string;
    optimization_enabled?: boolean;
    optimization_runs?: number | null;
    is_blueprint?: boolean;
    is_vyper_contract?: boolean;
    proxy_type?: string;
    implementations?: Array<{
        address?: string;
        name?: string;
    }>;
    has_methods_read_proxy?: boolean;
    has_methods_write_proxy?: boolean;
};
/** https://anyabi.xyz/ */
export declare class AnyABILoader implements ABILoader {
    #private;
    readonly name = "AnyABILoader";
    chainId?: number;
    constructor(config?: {
        chainId?: number;
    });
    getContract(address: string): Promise<ContractResult>;
    loadABI(address: string): Promise<any[]>;
}
export declare class AnyABILoaderError extends errors.LoaderError {
}
export interface SignatureLookup {
    loadFunctions(selector: string): Promise<string[]>;
    loadEvents(hash: string): Promise<string[]>;
}
export declare class MultiSignatureLookup implements SignatureLookup {
    lookups: SignatureLookup[];
    constructor(lookups: SignatureLookup[]);
    loadFunctions(selector: string): Promise<string[]>;
    loadEvents(hash: string): Promise<string[]>;
}
/** https://www.4byte.directory/ */
export declare class FourByteSignatureLookup implements SignatureLookup {
    load(url: string): Promise<string[]>;
    loadFunctions(selector: string): Promise<string[]>;
    loadEvents(hash: string): Promise<string[]>;
}
export declare class FourByteSignatureLookupError extends errors.LoaderError {
}
/**
 * https://openchain.xyz/
 * Formerly: https://sig.eth.samczsun.com/
 */
export declare class OpenChainSignatureLookup implements SignatureLookup {
    load(url: string): Promise<any>;
    loadFunctions(selector: string): Promise<string[]>;
    loadEvents(hash: string): Promise<string[]>;
}
export declare class OpenChainSignatureLookupError extends errors.LoaderError {
}
export declare class SamczunSignatureLookup extends OpenChainSignatureLookup {
}
export declare const defaultABILoader: ABILoader;
export declare const defaultSignatureLookup: SignatureLookup;
type LoaderEnv = {
    ETHERSCAN_API_KEY?: string;
    ETHERSCAN_BASE_URL?: string;
    SOURCIFY_CHAIN_ID?: string | number;
};
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
export declare function defaultsWithEnv(env: LoaderEnv): Record<string, ABILoader | SignatureLookup>;
export {};
