import * as AbiFunction from 'ox/AbiFunction';
import defaultKnownInterfaces from './_generated-interfaces.js';
export { defaultKnownInterfaces };
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
export function createInterfaceIndex(known) {
    const r = {};
    for (const [name, signatures] of Object.entries(known)) {
        const selectors = signatures.map(sig => AbiFunction.getSelector(sig).slice(2));
        if (selectors.length === 0)
            continue;
        r[name] = new Set(selectors);
    }
    return r;
}
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
export function abiToInterfaces(abiOrSelectors, knownInterfaces) {
    const r = [];
    if (abiOrSelectors.length === 0)
        return r;
    if (!knownInterfaces) {
        knownInterfaces = defaultKnownInterfaces;
    }
    const selectorSet = new Set(abiOrSelectors.map(s => {
        if (s.length === 8)
            return s;
        if (s.length === 10)
            return s.slice(2);
        return AbiFunction.getSelector(s).slice(2);
    }));
    for (const [name, interfaceSet] of Object.entries(knownInterfaces)) {
        // Find interfaces where we have all the selectors.
        if (isSupersetOf(selectorSet, interfaceSet)) {
            r.push(name);
        }
    }
    return r;
}
// TODO: Replace this with native Set.isSupersetOf once available
function isSupersetOf(a, b) {
    for (const elem of b) {
        if (!a.has(elem)) {
            return false;
        }
    }
    return true;
}
//# sourceMappingURL=interfaces.js.map