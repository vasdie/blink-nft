import * as errors from "./errors.js";
export interface StorageProvider {
    getStorageAt(address: string, slot: number | string): Promise<string>;
}
export interface CallProvider {
    call(transaction: {
        to: string;
        data: string;
    }): Promise<string>;
}
export interface CodeProvider {
    getCode(address: string): Promise<string>;
}
export interface ENSProvider {
    getAddress(name: string): Promise<string>;
}
export interface Provider extends StorageProvider, CallProvider, CodeProvider, ENSProvider {
}
export interface AnyProvider {
}
export declare function CompatibleProvider(provider: any): Provider;
/**
 * Wrap an existing provider into one that will return a fixed getCode result for items defined in codeCache.
 * The cache is treated as read-only, it will not be updated. Mainly used to avoid an extra RPC call when we already have the bytcode.
 *
 * For more advanced behaviours, consider copying this code and modifying it to your needs.
 *
 * @param provider - Any existing provider
 * @param codeCache - Object containing address => code mappings
 * @returns {Provider} - Provider that will return a fixed getCode result for items defined in codeCache.
 * @example
 * ```ts
 * const address = "0x0000000000000000000000000000000000000001";
 * const bytecode = "0x6001600101"
 * const cachedProvider = WithCachedCode(provider, {
 *   [address]: bytecode,
 * });
 * const code = await cachedProvider.getCode(address);
 * console.log(code); // "0x6001600101"
 * ```
 */
export declare function WithCachedCode(provider: AnyProvider, codeCache: Record<string, string>): Provider;
export declare class MissingENSProviderError extends errors.ProviderError {
}
export declare class Web3ProviderError extends errors.ProviderError {
}
