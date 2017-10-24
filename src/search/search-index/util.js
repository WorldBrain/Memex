import PromiseBatcher from 'src/util/promise-batcher'
import { RESULT_TYPES } from 'src/overview/constants'
import index, { DEFAULT_TERM_SEPARATOR } from './'

// Key generation functions
export const keyGen = {
    domain: key => `domain/${key}`,
    url: key => `url/${key}`,
    term: key => `term/${key}`,
    title: key => `title/${key}`,
    visit: key => `visit/${key}`,
    bookmark: key => `bookmark/${key}`,
}

export const removeKeyType = key =>
    key.replace(/^(term|title|visit|url|domain|bookmark)\//, '')

export const idbBatchToPromise = batch =>
    new Promise((resolve, reject) =>
        batch.write(err => (err ? reject(err) : resolve())),
    )

/**
 * Handles splitting up searchable content into indexable terms. Terms are all
 * lowercased.
 *
 * @param {string} content Searchable content text.
 * @param {string|RegExp} [separator=' '] Separator used to split content into terms.
 * @returns {string[]} Array of terms derived from `content`.
 */
export const extractContent = (
    content,
    { separator = DEFAULT_TERM_SEPARATOR, key = 'term' },
) => content.split(separator).map(word => keyGen[key](word.toLowerCase()))

/**
 * @param {Map<string, Map<string, IndexTermValue>>} termValuesMap Map of terms to assoc. page values.
 * @param {number} [boost=0.2] Boost to apply on base score.
 * @returns {Map<string, IndexTermValue>} Map of page IDs to boosted scores.
 */
export const boostScores = (termValuesMap, boost = 0.2) =>
    [...termValuesMap.values()].reduce((pageScoresMap, termValue) => {
        // Skip empty values
        if (termValue == null) {
            return pageScoresMap
        }

        // For each assoc. page to the term...
        for (const [pageId, score] of termValue) {
            const currScore = +score.latest

            if (!Number.isNaN(currScore)) {
                let newScore

                // ... boost score (extra boost, if found multiple times)
                if (pageScoresMap.has(pageId)) {
                    newScore = currScore + currScore * (boost + 0.1)
                } else {
                    newScore = currScore + currScore * boost
                }

                pageScoresMap.set(pageId, {
                    latest: newScore.toFixed(),
                })
            }
        }

        return pageScoresMap
    }, new Map())

/**
 * Transforms an indexed document into a search result.
 *
 * @param {IndexedPageDoc} document
 * @returns {SearchResult}
 */
export const structureSearchResult = (document, score = 1) => ({
    id: document.id,
    document,
    score,
})

/**
 * Runs a lookup over a range of DB keys, resolving to the collected docs.
 * Range can be specified with `gte` and `lte` keys in `iteratorOpts`, along
 * with a `limit` count.
 *
 * @param {any} iteratorOpts
 * @returns {Promise<Map<string, any>>}
 */
export const rangeLookup = iteratorOpts =>
    new Promise(resolve => {
        const data = new Map()
        index.db
            .createReadStream(iteratorOpts)
            .on('data', ({ key, value }) => data.set(key, value))
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
        })

        stream.on('end', () => resolve(data))
        stream.on('data', ({ key, value }) => {
            if (data.size >= limit) {
                stream.destroy()
                return resolve(data)
            }

            // Latest values will appear first, so only add if no matching key
            if (!data.has(value)) {
                data.set(value, { latest: removeKeyType(key) })
            }
        })
    })

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
) => keys =>
    new Promise(async resolve => {
        const result = new Map()
        const singleLookup = initSingleLookup({ defaultValue, asBuffer })

        if (!Array.isArray(keys)) {
            result.set(keys, await singleLookup(keys))
            return resolve(result)
        }

        // Set up PromiseBatcher instance to handle concurrent lookups on same IDBOpenDBRequest
        const batch = new PromiseBatcher({
            inputBatchCallback: () => Promise.resolve(keys),
            processingCallback: singleLookup,
            concurrency,
            observer: {
                next: ({ input, output }) => result.set(input, output),
                complete: () => resolve(result),
                error: console.error,
            },
        })

        batch.start()
    })

/**
 * NOTE: Assumes sorted arrays, last index containing latest.
 * @param {Array<string>} visits Sorted array of UNIX timestamp strings.
 * @param {Array<string>} bookmarks Sorted array of UNIX timestamp strings.
 * @returns {any} Object containing:
 *  - `latest`: latest UNIX timestamp of all params
 *  - `type`: currently either `bookmark` or `visit` to allow distinguishing the type later.
 */
export const getLatestMeta = (visits, bookmarks) => {
    const numVisits = visits.length
    const numBookmarks = bookmarks.length

    if (numVisits && numBookmarks) {
        // Both arrays have timestamps
        return visits[numVisits - 1] > bookmarks[numBookmarks - 1]
            ? { latest: visits[numVisits - 1], type: RESULT_TYPES.VISIT }
            : {
                  latest: bookmarks[numBookmarks - 1],
                  type: RESULT_TYPES.BOOKMARK,
              }
    } else if (numBookmarks) {
        // Only bookmark array has timestamps
        return {
            latest: bookmarks[numBookmarks - 1],
            type: RESULT_TYPES.BOOKMARK,
        }
    } else {
        // Only visit array has timestamps
        return { latest: visits[numVisits - 1], type: RESULT_TYPES.VISIT }
    }
}
