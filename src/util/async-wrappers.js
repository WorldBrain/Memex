/**
 * Wrapper around the sync `Array.prototype.filter` to allow using async logic
 * as the filter predicate.
 * @param {Array<any>} arr The data to filter.
 * @param {(any) => boolean} pred The async filter predicate that returns a bool/promise that resolves to a bool.
 * @returns {Array<any>} A filtered array containing data from the original array.
 */
export async function asyncFilter(arr, pred) {
    // Make a copy of the array contents; could theoretically change while resolving the async logic
    const arrCopy = Array.from(arr)

    // Runs all async logic (the predicate) against the array,
    //   leaving us with an array of bools that maps to the original data
    const results = await Promise.all(arrCopy.map(el => pred(el)))

    // Now that async logic is resolved, do a sync filter on the original data
    //   using the results at each array index
    return arrCopy.filter((el, i) => results[i])
}
