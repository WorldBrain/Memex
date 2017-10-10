/**
 * @param {string} path Path of nested object keys delimited by period ('.').
 * @return {Array<string>} Array of object keys in order of nesting.
 */
const strPathToArr = path => path.split('.')

/**
 * Allows safe access to deeply nested values in an object without needing conditionals or worring about
 * TypeErrors from attemping access on undefined keys.
 * Idea stolen from:
 * https://medium.com/javascript-inside/safely-accessing-deeply-nested-values-in-javascript-99bf72a0855a
 *
 * @param {string} path Standard object string path, denoting path of nested keys in an object delimted by period ('.')
 *  eg: with input: { a: { b: { c: 3 } } }, you could pass 'a.b.c' to safely grab 3 without worrying about TypeErrors
 *  being thrown in the case that a or b is undefined.
 * @param {any} object The object to attempt to get the value expressed via pathArr.
 * @return {any|null} Either the value found at pathArr on object, or null if it cannot be found.
 */
const safelyGet = (path = '') => (object = {}) =>
    strPathToArr(path).reduce((xs, x) => (xs && xs[x] ? xs[x] : null), object)

export default safelyGet
