import index from '.'
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
 * @param {object} data Index dump to export to JSON
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
 * @param {string} startAfter Index value to begin export from
 * @param {number} limit maximum number of docs to export into one file
 *
 */
async function grabDBChunk(startAfter = '', limit = 1000) {
    const data = []

    return new Promise((resolve, reject) =>
        index
            .createReadStream({ gt: startAfter, limit })
            .on('data', datum => data.push(datum))
            .on('error', reject)
            .on('end', () => resolve(data)),
    )
}

async function restorePage({ key, value }) {
    await db.put({
        _id: key,
        url: value._pouchData.url,
        content: {
            title: value._pouchData.title,
        },
    })

    await index.put(key, {
        ...value,
        terms: new Set(value.terms || []),
        titleTerms: new Set(value.titleTerms || []),
        urlTerms: new Set(value.urlTerms || []),
        visits: new Set(value.visits || []),
        bookmarks: new Set(value.bookmarks || []),
        tags: new Set(value.tags || []),
    })
}

function restoreDatum(datum) {
    if (datum.key.startsWith(pageKeyPrefix)) {
        return restorePage(datum)
    } else if (
        // Visits, bookmarks
        datum.key.startsWith(visitKeyPrefix) ||
        datum.key.startsWith(bookmarkKeyPrefix)
    ) {
        return index.put(datum.key, datum.value)
    }

    // Everything else is a Map
    return index.put(datum.key, new Map(datum.value))
}

/**
 * @param {any[]} Array of the index data key value pairs to be inserted.
 */
export async function restoreDB(data) {
    for (const datum of data) {
        try {
            await restoreDatum(datum) // Try to restore current data
        } catch (err) {
            console.warn(err)
            continue // Keep restoring the rest
        }
    }
}

/**
 * @param {number} chunkSize Length of the chunk for piecewise export. Suggested value range: 500 - 1000
 *
 */
export async function dumpDB(chunkSize = 5000) {
    let startAfter, chunk
    let fileCount = 0

    do {
        chunk = await grabDBChunk(startAfter, chunkSize)
        await downloadChunk(chunk, `${DUMP_DIR}/index-${++fileCount}.json`)

        // Set `startAfter` to last key, so that next iteration will be new data
        startAfter = chunk[chunk.length - 1].key
    } while (chunk.length === chunkSize) // If chunk `length` prop is < `chunkSize`, means we've run out of data
}
