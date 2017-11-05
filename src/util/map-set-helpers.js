// TODO: either make these more consistent or find some util lib that does the same

/**
 * @param {Map<any,any>[]} mapArr
 * @returns {Map<any,any>} Intersection Map of all input maps
 */
export const intersectManyMaps = mapArr =>
    mapArr.reduce((accMap, currMap) => intersectMaps(accMap)(currMap))

/**
 * @param {Map<any, any>} b
 * @returns {(a: Map<any, any>) => Map<any, any>}
 */
export const intersectMaps = b => a =>
    new Map([...a].filter(([key]) => b.has(key)))

/**
 * @param {Set<any>} b
 * @returns {(a: Set<any>) => Set<any>}
 */
export const intersectSets = b => a => new Set([...a].filter(val => b.has(val)))

/**
 * @param {Map|Set|Array} map
 * @returns {boolean}
 */
export const containsEmptyVals = iterable =>
    [...iterable].reduce(
        (acc, curr) => acc || curr == null || !curr.size,
        false,
    )

/**
 * Reduces a Map of keys to Map values into a unioned Map of the nested Map values.
 * EG:
 * The Map:
 *  {
 *      category_a: { dogs: 'yep', cats: 'nope' },
 *      category_a: { fish: 'yep', cats: 'yep' },
 *  }
 * would produce a Map like:
 *  { dogs: 'yep', fish: 'yep', cats: 'yep' }
 *
 * @param {Map<any, Map<T, K>>} map
 * @returns {Map<T, K>}
 */
export const unionNestedMaps = map =>
    new Map([...map.values()].reduce((acc, value) => [...acc, ...value], []))

/**
 * Performs set difference on the provided Maps.
 */
export const differMaps = b => a =>
    new Map([...a].filter(([key]) => !b.has(key)))
