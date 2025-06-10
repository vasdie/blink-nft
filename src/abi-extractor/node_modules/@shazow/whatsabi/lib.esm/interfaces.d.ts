import defaultKnownInterfaces from './_generated-interfaces.js';
export { defaultKnownInterfaces };
export type KnownInterfaces = Record<string, Array<string>>;
export type IndexedInterfaces = Record<string, Set<string>>;
/** Given a lookup of known interfaces, produce a lookup index to use with {@link abiToInterfaces}.
 * @example
 * ```ts
 * const myInterfaceIndex = whatsabi.interfaces.createInterfaceIndex(
 *   Object.assign({},
 *     // Include defaults?
 *     whatsabi.interfaces.defaultKnownInterfaces,
 *     // Our special secret interface we want to detect
 *     {
 *       "MyInterface": [ "function Foo() returns (uint256)", "function Bar()" ],
 *     },
 *   ),
 * );
 *
 * const detectedInterfaces = whatsabi.interfaces.abiToInterfaces(abi, myInterfaceIndex);
 * ```
 */
export declare function createInterfaceIndex(known: KnownInterfaces): IndexedInterfaces;
/** Given a list of selectors, return a mapping of interfaces it implements to a list of present function signatures that belong to it.
 * @param {string[]} abiOrSelectors - ABI or a list of selectors or signatures to match against.
 * @param {KnownInterfaces?} knownInterfaces - A mapping of known interfaces to function signatures that belong to them. Use {@link createInterfaceIndex} to produce your own, or omit to use {@link defaultKnownInterfaces}.
 * @returns {string[]} A list of interfaces that the given selectors implement.
 * @example
 * ```ts
 * const result = await whatsabi.autoload(address, { provider });
 * const detectedInterfaces = whatsabi.interfaces.abiToInterfaces(result.abi);
 * ```
 */
export declare function abiToInterfaces(abiOrSelectors: any[], knownInterfaces?: IndexedInterfaces): string[];
