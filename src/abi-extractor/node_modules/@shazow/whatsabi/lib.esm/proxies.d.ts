/**
 * @module proxies
 * This module contains code to resolve a variety of types of proxies.
 *
 * The resolvers are detected and configured by whatsabi.autoload(...).
 *
 * If you already know which proxy it is and how it's configured, then the resolvers could be used manually too.
 *
 * @example
 * Using WhatsABI to only resolve proxies with a known bytecode:
 * ```ts
 * const address = "0x...";
 *
 * // Skip this and use the regular `provider` if you don't already have the bytecode or don't care about saving an RPC call. :)
 * const bytecode = "0x..."; // Already loaded from somewhere
 * const cachedCodeProvider = whatsabi.providers.WithCachedCode(provider, {
 *   [address]: bytecode,
 * });
 *
 * const result = whatsabi.autoload(address, {
 *   provider: cachedCodeProvider,
 *   abiLoader: false, // Skip ABI loaders
 *   signatureLookup: false, // Skip looking up selector signatures
 * })
 *
 * if (result.address !== address) console.log(`Resolved proxy: ${address} -> ${result.address}`);
 * if (result.proxies.length > 0) console.log("Proxies detected:", result.proxies);
 * // Note that some proxies can only be resolved relative to a selector, like DiamondProxy. These will need to be resolved manually via result.proxies.
 * ```
 *
 * @example
 * Resolve a DiamondProxy:
 * ```ts
 * // Let's say we have a result with a DiamondProxy in it, from the above example
 * const resolver = result.proxies[0] as whatsabi.proxies.DiamondProxyResolver;
 *
 * // DiamondProxies have different contracts mapped relative to the selector,
 * // so we must resolve them against a selector.
 * const selector = "0x6e9960c3";  // function getAdmin() returns (address)
 *
 * const implementationAddress = await resolver.resolve(provider, address, selector);
 * ```
 *
 * @example
 * Get all facets and selectors for a DiamondProxy:
 * ```ts
 * // Let's say we have a result with a DiamondProxy in it, from the above example
 * const diamondResolver = result.proxies[0] as DiamondProxyResolver;
 * const facets = await diamondResolver.facets(provider, address); // All possible address -> selector[] mappings
 * ```
 */
import type { StorageProvider, CallProvider } from "./providers.js";
export interface ProxyResolver {
    readonly name: string;
    resolve(provider: StorageProvider | CallProvider, address: string, selector?: string): Promise<string>;
    toString(): string;
}
export declare class BaseProxyResolver {
    name: string;
    constructor(name?: string);
    toString(): string;
}
export declare class GnosisSafeProxyResolver extends BaseProxyResolver implements ProxyResolver {
    resolve(provider: StorageProvider, address: string): Promise<string>;
}
export declare class LegacyUpgradeableProxyResolver extends BaseProxyResolver implements ProxyResolver {
    resolve(provider: StorageProvider, address: string): Promise<string>;
}
export declare class EIP1967ProxyResolver extends BaseProxyResolver implements ProxyResolver {
    name: string;
    resolve(provider: StorageProvider & CallProvider, address: string): Promise<string>;
}
export declare class DiamondProxyResolver extends BaseProxyResolver implements ProxyResolver {
    name: string;
    readonly storageSlot: string;
    constructor(name: string, overrideStorageSlot?: string);
    resolve(provider: StorageProvider & CallProvider, address: string, selector: string): Promise<string>;
    facets(provider: StorageProvider, address: string, config?: {
        limit: number;
    }): Promise<Record<string, string[]>>;
    selectors(provider: StorageProvider, address: string): Promise<string[]>;
}
export declare class ZeppelinOSProxyResolver extends BaseProxyResolver implements ProxyResolver {
    name: string;
    resolve(provider: StorageProvider, address: string): Promise<string>;
}
export declare class PROXIABLEProxyResolver extends BaseProxyResolver implements ProxyResolver {
    name: string;
    resolve(provider: StorageProvider, address: string): Promise<string>;
}
export declare class SequenceWalletProxyResolver extends BaseProxyResolver implements ProxyResolver {
    name: string;
    resolve(provider: StorageProvider, address: string): Promise<string>;
}
export declare class FixedProxyResolver extends BaseProxyResolver implements ProxyResolver {
    name: string;
    readonly resolvedAddress: string;
    constructor(name: string, resolvedAddress: string);
    resolve(provider: StorageProvider, address: string): Promise<string>;
}
export declare const slots: Record<string, string>;
export declare const slotResolvers: Record<string, ProxyResolver>;
