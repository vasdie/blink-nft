import type { AnyProvider } from "./providers.js";
import type { ABI } from "./abi.js";
import { type ProxyResolver } from "./proxies.js";
import type { ABILoader, SignatureLookup, ContractResult } from "./loaders.js";
export declare const defaultConfig: {
    onProgress: (_: string) => void;
    onError: (phase: string, err: Error) => boolean;
};
/** AutoloadResult is the return type for the {@link autoload} function. */
export type AutoloadResult = {
    address: string;
    abi: ABI;
    /** Whether the `abi` is loaded from a verified source */
    abiLoadedFrom?: ABILoader;
    /** Full contract metadata result, only included if {@link AutoloadConfig.loadContractResult} is true. */
    contractResult?: ContractResult;
    /** List of resolveable proxies detected in the contract */
    proxies: ProxyResolver[];
    /**
     * Follow proxies to next result.
     * If multiple proxies were detected, some reasonable ordering of attempts will be made.
     * Note: Some proxies operate relative to a specific selector (such as DiamondProxy facets), in this case we'll need to specify a selector that we care about.
     */
    followProxies?: (selector?: string) => Promise<AutoloadResult>;
    /**
     * Set to true when a CREATE or CREATE2 opcode is present in the bytecode.
     * This means that some of the results could have been mistaken from the embedded contract that gets created by the factory.
     * For example, we can have a non-proxy contract which creates a proxy contract on call. WhatsABI may not yet be able to distinguish them reliably.
     *
     * @experimental
     */
    isFactory?: boolean;
    /** Set to true if the address has deployed code */
    hasCode: boolean;
};
/**
 * AutoloadConfig specifies the configuration inputs for the {@link autoload} function.
 **/
export type AutoloadConfig = {
    /** @group Required */
    provider: AnyProvider;
    /** @group Loaders */
    abiLoader?: ABILoader | false;
    /** @group Loaders */
    signatureLookup?: SignatureLookup | false;
    /** Hooks: */
    /**
     * Called during various phases: resolveName, getCode, abiLoader, signatureLookup, followProxies
     * @group Hooks
     */
    onProgress?: (phase: string, ...args: any[]) => void;
    /**
     * Called during any encountered errors during a given phase
     * @group Hooks
     */
    onError?: (phase: string, error: Error) => boolean | void;
    /**
     * Called to resolve invalid addresses, uses provider's built-in resolver otherwise
     * @group Hooks
     */
    addressResolver?: (name: string) => Promise<string>;
    /** Settings: */
    /**
     * Enable following proxies automagically if *reasonable*. Return the final result.
     *
     * Some caveats:
     * - Proxies that are relative to a specific selector (such as DiamondProxies) will not be followed.
     * - Contracts that are not primarily proxies will not be followed. Current heuristic is containing at most 5 SSTORE instructions. (See Issue #173)
     *
     * @group Settings
     */
    followProxies?: boolean;
    /**
     * Load full contract metadata result, include it in {@link AutoloadResult.contractResult} if successful.
     *
     * This changes the behaviour of autoload to use {@link ABILoader.getContract} instead of {@link ABILoader.loadABI},
     * which returns a larger superset result including all of the available verified contract metadata.
     */
    loadContractResult?: boolean;
    /**
     * Enable pulling additional metadata from WhatsABI's static analysis which may be unreliable.
     * For now, this is primarily for event topics.
     *
     * @group Settings
     * @experimental
     */
    enableExperimentalMetadata?: boolean;
};
/**
 * autoload is a convenience helper for doing All The Things to load an ABI of a contract address, including resolving proxies.
 * @param address - The address of the contract to load
 * @param config - the {@link AutoloadConfig} object
 * @example
 * ```typescript
 * import { ethers } from "ethers";
 * import { whatsabi } from "@shazow/whatsabi";
 *
 * const provider = ethers.getDefaultProvider(); // substitute with your fav provider
 * const address = "0x00000000006c3852cbEf3e08E8dF289169EdE581"; // Or your fav contract address
 *
 * // Quick-start:
 *
 * const result = await whatsabi.autoload(address, { provider });
 * console.log(result.abi);
 * // -> [ ... ]
 * ```
 * @example
 * See {@link AutoloadConfig} for additional features that can be enabled.
 * ```typescript
 * const result = await whatsabi.autoload(address, {
 *   provider,
 *   followProxies: true,
 *   loadContractResult: true, // Load full contract metadata (slower)
 *   enableExperimentalMetadata: true, // Include less reliable static analysis results (e.g. event topics)
 *   // and more! See AutoloadConfig for all the options.
 * });
 * ```
 */
export declare function autoload(address: string, config: AutoloadConfig): Promise<AutoloadResult>;
