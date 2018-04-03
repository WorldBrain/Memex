import promiseLimit from 'promise-limit'

import { decode } from 'src/util/encode-url-for-id'
import index, { indexQueue } from './'

// Key generation functions
export const keyGen = {
    domain: key => `domain/${key}`,
    tag: key => `tag/${key}`,
    url: key => `url/${key}`,
    term: key => `term/${key}`,
    title: key => `title/${key}`,
    visit: key => `visit/${key}`,
    bookmark: key => `bookmark/${key}`,
    _: key => key,
}

export const removeKeyType = (key = '') =>
    key.replace(/^(page|term|title|visit|url|domain|tag|bookmark)\//, '')

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

export const idbBatchToPromise = batch =>
    new Promise((resolve, reject) =>
        batch.write(err => (err ? reject(err) : resolve())),
    )

/**
 * @param {string} pageId ID of existing reverse index page.
 * @returns {any} The corresponding reverse index page doc.
 * @throws {Error} If `pageId` param does not have a corresponding doc existing in DB.
 */
export async function fetchExistingPage(pageId) {
    const reverseIndexDoc = await initSingleLookup()(pageId)

    if (reverseIndexDoc == null) {
        throw new Error(
            `No document exists in reverse page index for the supplied page ID: ${pageId}`,
        )
    }

    return reverseIndexDoc
}

/**
 * @param {Map<string, Map<string, IndexTermValue>>} termValuesMap Map of terms to assoc. page values.
 * @param {number} [boost=0.2] Boost to apply on base score.
 * @returns {Map<string, IndexTermValue>} Map of page IDs to boosted scores.
 */
export function boostScores(pageScoresMap, boost = 0) {
    if (boost === 0) {
        return pageScoresMap
    }

    for (const [pageId, score] of pageScoresMap) {
        const currScore = +score.latest

        if (!Number.isNaN(currScore)) {
            const newScore = currScore * (1 + boost)
            pageScoresMap.set(pageId, { latest: newScore.toFixed() })
        }
    }
    return pageScoresMap
}

/**
 * Performs a range lookup on a specific terms index, returning only those data
 * that appear in the Set of terms supplied in `termsSet`.
 *
 * @param {string} termKey The specific term index prefix to lookup.
 * @param {Set<string>} termsSet Set of term keys to include in the result.
 * @returns {Promise<Map<string, string>>} Map of term keys to term values found. Keys will be
 *  indentical to `termsSet`, while values will be the found value (if exist in index), else `null`.
 */
export const termRangeLookup = (termKey, termsSet) =>
    new Promise(resolve => {
        // Init Map as keys from `termsSet` to `null` values
        const results = new Map([...termsSet].map(key => [key, null]))

        index.db
            .createReadStream({
                gte: termKey,
                lte: `${termKey}\uffff`,
                keyAsBuffer: false,
                valueAsBuffer: false,
            })
            .on('data', ({ key, value }) => {
                // Only add current data to results if it appears in the set of terms we're looking for (else ignore)
                if (termsSet.has(key)) {
                    results.set(key, value)
                }
            })
            .on('end', () => resolve(results))
    })

/**
 * Newer visit and bookmarks have object values instead of single strings representing page IDs,
 * to allow the storage and association of further data. This allows both shapes to be treated the same.
 *
 * @param {string|any} value Value stored under a visit key.
 * @returns {any} Object containing `pageId` string and `meta` object containing any other data.
 */
export function normalizeTimestampVals(value) {
    if (typeof value === 'string') {
        return { pageId: value, meta: {} }
    }
    const { pageId, ...meta } = value

    return { pageId, meta }
}

/**
 * Runs a lookup over a range of DB keys, resolving to the collected docs.
 * Range can be specified with `gte` and `lte` keys in `iteratorOpts`, along
 * with a `limit` count.
 *
 * @param {any} iteratorOpts
 * @returns {Promise<Map<string, string>>}
 */
export const rangeLookup = iteratorOpts =>
    new Promise(resolve => {
        const data = new Map()
        index.db
            .createReadStream({
                ...iteratorOpts,
                keyAsBuffer: false,
                valueAsBuffer: false,
            })
            .on('data', ({ key, value }) => {
                const { pageId } = normalizeTimestampVals(value)
                data.set(key, pageId)
            })
            .on('end', () => resolve(data))
    })

/**
 * Runs a lookup over a range of DB keys until a results limit is reached,
 * rather than a limit of # docs searched through.
 * Range for lookup can be specified with `gte` and `lte` keys in `iteratorOpts`, along
 * with a `limit` count of docs to return.
 *
 * @param {any} iteratorOpts
 * @returns {Promise<Map<string, any>>}
 */
export const reverseRangeLookup = ({ limit = Infinity, ...iteratorOpts }) =>
    new Promise(resolve => {
        const data = new Map()
        const stream = index.db.createReadStream({
            ...iteratorOpts,
            reverse: true,
            keyAsBuffer: false,
            valueAsBuffer: false,
        })

        stream.on('end', () => resolve(data))
        stream.on('data', ({ key, value }) => {
            if (data.size >= limit) {
                stream.destroy()
                return resolve(data)
            }

            const { pageId, meta } = normalizeTimestampVals(value)
            if (!data.has(pageId)) {
                data.set(pageId, { latest: removeKeyType(key), ...meta })
            }
        })
    })

/**
 * @param {boolean} [trimPrefix=true] Whether or not to trim the `page/` prefix from all returned keys.
 * @returns {Promise<any>} Resolves to an object containing `histKeys` and `bmKeys` Sets of found history and
 *  bookmark keys, respectively, for all pages indexed.
 */
export const grabExistingKeys = () => {
    return new Promise(resolve => {
        const histKeys = new Set()
        const bmKeys = new Set()

        index.db
            .createReadStream({
                gte: 'page/',
                lte: 'page/\uffff',
                keyAsBuffer: false,
                valueAsBuffer: false,
            })
            .on('data', ({ key, value }) => {
                const url = decode(removeKeyType(key))
                if (value && value.bookmarks && value.bookmarks.size) {
                    bmKeys.add(url)
                }
                histKeys.add(url)
            })
            .on('end', () => {
                resolve({
                    histKeys,
                    bmKeys,
                })
            })
    })
}

const defLookupOpts = {
    defaultValue: null,
    asBuffer: false,
    concurrency: 5,
}

export const initSingleLookup = (
    { defaultValue = null, asBuffer = false } = defLookupOpts,
) => async key => {
    try {
        return await index.get(key, { asBuffer })
    } catch (error) {
        if (error.notFound) {
            return defaultValue
        }
        throw error
    }
}

/**
 * Performs concurrent lookups on different keys.
 *
 * @param {number} [concurrent=5] Optional concurrency level to run lookups at.
 * @returns {(keys: string|string[]) => Promise<any|Map<string, any>>} Function taking single or array
 *  of keys to lookup in index. Unique expected. Returns Promise resolving to single or Map of
 *  documents matching given `keys` param.
 */
export const initLookupByKeys = (
    { concurrency = 5, defaultValue = null, asBuffer = false } = defLookupOpts,
) => async keys => {
    const singleLookup = initSingleLookup({ defaultValue, asBuffer })
    let entries

    if (!Array.isArray(keys)) {
        entries = [[keys, await singleLookup(keys)]]
    } else {
        const runConcurrent = promiseLimit(concurrency)
        entries = await runConcurrent.map(keys, async key => [
            key,
            await singleLookup(key),
        ])
    }
    return new Map(entries)
}

const getLatestVisitOrBookmark = ({ visits, bookmarks }) =>
    !visits.size
        ? [...bookmarks][bookmarks.size - 1]
        : [...visits][visits.size - 1]

/**
 * Augments a reverse index/lookup doc with `latest` timestamp field. Used for general-case search scoring.
 * @param {IndexLookupDoc} doc
 * @returns {any} `doc` with new `latest` field denoting the latest visit (or bookmark if no visits).
 */
export const augmentIndexLookupDoc = doc => ({
    ...doc,
    latest: removeKeyType(getLatestVisitOrBookmark(doc)),
})
