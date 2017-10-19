/**
 * @param {Map<any, any>} b
 * @returns {(a: Map<any, any>) => Map<any, any>}
 */
export const intersectMaps = b => a =>
    new Map([...a].filter(([key]) => b.has(key)))
