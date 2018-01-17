import { indexQueue } from '..'
import { setTags as setDef, addTags as addDef } from './add'
import { delTags as delDef } from './del'

/**
 * @param {(args: any) => Promise<any>} fn Any async function to place on the index operations queue.
 * @returns {(args: any) => Promise<any>} Bound version of `fn` that will finish once `fn` gets run
 *  on the index queue and finishes.
 */
export const makeIndexFnConcSafe = fn => (...args) =>
    new Promise((resolve, reject) =>
        indexQueue.push(() =>
            fn(...args)
                .then(resolve)
                .catch(reject),
        ),
    )

// Augment a bunch of methods by placing them on the index queue first
const setTags = makeIndexFnConcSafe(setDef)
const addTags = makeIndexFnConcSafe(addDef)
const delTags = makeIndexFnConcSafe(delDef)

export { default as suggestTags, fetchTags } from './suggest'
export { setTags, addTags, delTags }
