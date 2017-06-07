import identity from 'lodash/identity'

/**
 * Does a group by on a collection, while maintaining the collection's sort order by outputting
 * a nested array. Interface tries to mirror lodash's fp groupBy function, however iteratee assumes
 * function type to simplify code (lodash also accepts strings via _.property fn).
 *
 * @param {(any) => any} iteratee Fn to grab the value from the items in coll to "group" on. Default is _.identity fn.
 * @param {Array<any>} coll Array of any values to group by value denoted by in iteratee fn.
 * @return {Array<Array<any>>} Array of arrays denoting the groups found. Array order will be based on the input array.
 *  Sub-array orders, containing the grouped items, will be ordered based on the order of those items from the original
 *  input array (index 0 is earliest in input array, index `length - 1` is latest).
 */
const orderedGroupBy = (iteratee = identity) => (coll = []) => {
    // Stores ordered grouping data temporarily; unique groups afforded by object key constraints
    const tmp = {}
    // Grouped version of the input collection; will ref values of the tmp object
    const groupedColl = []

    coll.forEach(item => {
        const groupKey = iteratee(item)
        if (!groupKey) { return } // If the groupby key is missing, skip it (left out of the result)

        // Create new group if not already there
        if (!tmp[groupKey]) {
            tmp[groupKey] = []
            groupedColl.push(tmp[groupKey]) // Ref the array holding the grouped data
        }

        // Add new item to the tmp grouped data array
        tmp[groupKey].push(item)
    })

    return groupedColl
}

export default orderedGroupBy
