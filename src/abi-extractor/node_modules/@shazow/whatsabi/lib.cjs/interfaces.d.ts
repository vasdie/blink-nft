import defaultKnownInterfaces from './_generated-interfaces.js';
export { defaultKnownInterfaces };
export type KnownInterfaces = Record<string, Array<string>>;
export type IndexedInterfaces = Record<string, Set<string>>;
export declare function createInterfaceIndex(known: KnownInterfaces): IndexedInterfaces;
export declare function abiToInterfaces(abiOrSelectors: any[], knownInterfaces?: IndexedInterfaces): string[];
