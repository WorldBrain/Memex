import index from '.'
import { idbBatchToPromise } from './util'
import db from 'src/pouchdb'
import { pageKeyPrefix } from 'src/page-storage'
import { visitKeyPrefix } from 'src/activity-logger'
import { bookmarkKeyPrefix } from 'src/bookmarks'

export const DUMP_DIR = 'worldbrain-db-dump/'

const flattenSet = (set = []) => [...set]

/**
 * Handles transforming a page into serializable object. Page index docs require
 * an additional lookup on PouchDB to get certain display data.
 *
 * @param {any} datum Data object to which Pouch data is added if applicable
 */
async function transformPage({ key, value }) {
    let _pouchData
    try {
        const pageData = await db.get(key)
        _pouchData = {
            url: pageData.url,
            title: pageData.content.title,
        }
    } catch (err) {
        _pouchData = {}
        console.error(err)
    }

    return {
        key,
        value: {
            ...value,
            terms: flattenSet(value.terms),
            titleTerms: flattenSet(value.titleTerms),
            urlTerms: flattenSet(value.urlTerms),
            visits: flattenSet(value.visits),
            bookmarks: flattenSet(value.bookmarks),
            tags: flattenSet(value.tags),
            _pouchData,
        },
    }
}

/**
 * @param {object} datum Data object to serialize for JSON dump
 */
function transformData({ key, value }) {
    if (key.startsWith(pageKeyPrefix)) {
        return transformPage({ key, value })
    }

    return {
        key,
        value:
            value instanceof Map || value instanceof Set ? [...value] : value,
    }
}

/**
 * @param {any[]} data Array of KVPs to process.
 * @param {number} counter Integer that maintains the count of exported files
 *
 */
async function downloadChunk(data, filename) {
    const transformedData = await Promise.all(data.map(transformData))
    const serialized = [JSON.stringify(transformedData)]
    const blob = new Blob(serialized, { type: 'application/json' })

    return browser.downloads.download({
        url: URL.createObjectURL(blob),
        saveAs: false,
        filename,
    })
}
/**
 * @param {string} [startAfter=''] Index key to start collecting data from.
 * @param {number} [limit=5000] Max # of docs to collect (# of docs after initial key).
 * @return {Promise<any[]>} Resolves to an array of key-value-pairs.
 *
 */
async function grabDBChunk(startAfter = '', limit = 5000) {
    const data = []

    return new Promise((resolve, reject) =>
        index
            .createReadStream({ gt: startAfter, limit })
            .on('data', datum => data.push(datum))
            .on('error', reject)
            .on('end', () => resolve(data)),
    )
}

/**
 * Attempts to create a new pouch page doc for given KVP + processing the data for IndexedDB insertion.
 *
 * @param {any} pageKVP
 * @return {Promise<any>} Resolves to the object containing `key` and `value` props ready for DB insertion.
 */
async function processPageKVP({ key, value }) {
    await db.put({
        _id: key,
        url: value._pouchData.url,
        content: {
            title: value._pouchData.title,
        },
    })

    return {
        key,
        value: {
            ...value,
            terms: new Set(value.terms || []),
            titleTerms: new Set(value.titleTerms || []),
            urlTerms: new Set(value.urlTerms || []),
            visits: new Set(value.visits || []),
            bookmarks: new Set(value.bookmarks || []),
            tags: new Set(value.tags || []),
        },
    }
}

/**
 * Processes a KVP pair object (`key` and `value` props) for restoring into IndexedDB.
 * If a page is encountered, it will attempt to restore that pouch doc.
 *
 * @param {any} kvp
 * @return {Promise<any>} Resolves to the object containing `key` and `value` props ready for DB insertion.
 */
function processKVPForRestore({ key, value }) {
    if (key.startsWith(pageKeyPrefix)) {
        return processPageKVP({ key, value })
    } else if (
        // Visits, bookmarks
        key.startsWith(visitKeyPrefix) ||
        key.startsWith(bookmarkKeyPrefix)
    ) {
        return Promise.resolve({ key, value })
    }

    // Everything else is a Map
    return Promise.resolve({ key, value: new Map(value) })
}

/**
 * @param {any[]} kvps Array of the index data key value pairs to be inserted.
 * @return {Promise<void>} Resolves when all KVPs restored. Error'd KVPs get skipped.
 */
export async function restoreDB(kvps) {
    const restoreBatch = index.batch()

    for (const kvp of kvps) {
        try {
            const { key, value } = await processKVPForRestore(kvp)
            restoreBatch.put(key, value)
        } catch (err) {
            console.warn(err)
            continue // Skip current KVP, but keep restoring the rest
        }
    }

    // Run all the DB ops at once for this batch of KVPs
    return idbBatchToPromise(restoreBatch)
}

/**
 * @param {number} [kvpPerFile=5000] Number of KVPs per dump file.
 * @return {Promise<void>} Resolves when all the dump files are downloaded.
 */
export async function dumpDB(kvpPerFile = 5000) {
    let startAfter, chunk
    let fileCount = 0

    do {
        chunk = await grabDBChunk(startAfter, kvpPerFile)
        await downloadChunk(chunk, `${DUMP_DIR}/index-${++fileCount}.json`)

        // Set `startAfter` to last key, so that next iteration will be new data
        startAfter = chunk[chunk.length - 1].key
    } while (chunk.length === kvpPerFile) // If chunk `length` prop is < `chunkSize`, means we've run out of data
}
