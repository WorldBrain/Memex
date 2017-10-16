import PromiseBatcher from 'src/util/promise-batcher'
import { RESULT_TYPES } from 'src/overview/constants'
import index, { DEFAULT_TERM_SEPARATOR } from './'

// Key generation functions
export const keyGen = {
    term: key => `term/${key}`,
    visit: key => `visit/${key}`,
    bookmark: key => `bookmark/${key}`,
}

export const standardResponse = (resolve, reject) => (err, data = true) =>
    err ? reject(err) : resolve(data)

/**
 * Handles splitting up searchable content into indexable terms. Terms are all
 * lowercased.
 *
 * @param {string} content Searchable content text.
 * @param {string|RegExp} [separator=' '] Separator used to split content into terms.
 * @returns {string[]} Array of terms derived from `content`.
 */
export const extractTerms = (content, separator = DEFAULT_TERM_SEPARATOR) =>
    content.split(separator).map(term => keyGen.term(term.toLowerCase()))

/**
 * Transforms an indexed document into a search result.
 * NOTE: score is always the same as there is yet term frequency
 *   to derive relevance from.
 *
 * @param {IndexedPageDoc} document
 * @returns {SearchResult}
 */
export const structureSearchResult = (document, score = 1) => ({
    id: document.id,
    document,
    score,
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
 * @returns {(keys: string|string[]) => Promise<any|Array<any>>} Function taking single or array
 *  of keys to lookup in index. Unique expected. Returns Promise resolving to single or array of
 *  documents matching given `keys` param.
 */
export const initLookupByKeys = (
    { concurrency = 5, defaultValue = null, asBuffer = false } = defLookupOpts,
) => keys =>
    new Promise(async resolve => {
        const result = []
        const singleLookup = initSingleLookup({ defaultValue, asBuffer })

        if (!Array.isArray(keys)) {
            return resolve(await singleLookup(keys))
        }

        // Set up PromiseBatcher instance to handle concurrent lookups on same IDBOpenDBRequest
        const batch = new PromiseBatcher({
            inputBatchCallback: () => Promise.resolve(keys),
            processingCallback: singleLookup,
            concurrency,
            observer: {
                next: ({ output }) => result.push(output),
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

// Below are mostly standard Promise wrappers around search-index stream-based methods
// TODO: Reimplement these
export async function size() {
    return new Promise((...args) => index.countDocs(standardResponse(...args)))
}

export async function destroy() {
    return new Promise((resolve, reject) =>
        index.flush(err => (err ? reject(err) : resolve('index destroyed'))),
    )
}
