import PromiseBatcher from 'src/util/promise-batcher'
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
) =>
    content
        .split(separator)
        .map(word => keyGen[key](word.toLowerCase()))
        .filter(term => !term.endsWith('/'))

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
            nextInputBatchCb: () => Promise.resolve(keys),
            processingCb: singleLookup,
            concurrency,
            observer: {
                next: ({ input, output }) => result.set(input, output),
                complete: () => resolve(result),
                error: console.error,
            },
        })

        batch.start()
    })

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
