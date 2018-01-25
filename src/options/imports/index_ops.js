import index from 'src/search/search-index'
import db from 'src/pouchdb'
import { pageKeyPrefix } from 'src/page-storage'
import { visitKeyPrefix } from 'src/activity-logger'
import { bookmarkKeyPrefix } from 'src/bookmarks'

const idb = index.db._db

/**
 * @param {object} datum Data object to which Pouch data is added if applicable
 *
 */
async function transformPage(datum) {
    let _pouchData
    try {
        const pageData = await db.get(datum.value.id)
        _pouchData = {
            url: pageData.url,
            title: pageData.content.title,
        }
        console.log(pageData)
    } catch (err) {
        _pouchData = {}
        console.error(err)
    }
    return {
        key: datum.key,
        value: {
            ...datum.value,
            _pouchData,
        },
    }
}

/**
 * @param {object} datum Data object to serialize for JSON dump
 *
 */
const transformData = datum => {
    if (datum.key.startsWith(pageKeyPrefix)) {
        const temp = transformPage(datum)
        console.log(temp)
        return temp
    }
    return {
        key: datum.key,
        value:
            datum.value instanceof Map || datum.value instanceof Set
                ? [...datum.value]
                : datum.value,
    }
}

/**
 * @param {object} data Index dump to export to JSON
 * @param {number} counter Integer that maintains the count of exported files
 *
 */
async function downloadChunk(data, counter) {
    const transformedData = await Promise.all(data.map(transformData))
    return browser.downloads.download({
        url: URL.createObjectURL(
            new Blob([JSON.stringify(transformedData)], {
                type: 'application/json',
            }),
        ),
        filename: `worldbrain_index_${counter}.json`,
        saveAs: false,
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
        idb
            .createReadStream({ gt: startAfter, limit })
            .on('data', datum => data.push(datum))
            .on('error', reject)
            .on('end', () => resolve(data)),
    )
}

/**
 * @param {number} chunkSize Length of the chunk for piecewise export. Suggested value range: 500 - 1000
 *
 */
export async function exportIndex(chunkSize = 500) {
    let startAfter, chunk
    let counter = 1

    do {
        chunk = await grabDBChunk(startAfter, chunkSize)

        await downloadChunk(chunk, counter)
        counter = counter + 1
        // Set `startAfter` to last key, so that next iteration will be new data
        startAfter = chunk[chunk.length - 1].key
    } while (chunk.length === chunkSize) // If chunk `length` prop is < `chunkSize`, means we've run out of data
}

/**
 * @param {JSON Array} JSON array of the index data to be inserted
 */
export async function importIndex(data) {
    for (const datum of data) {
        if (datum.key.startsWith(pageKeyPrefix)) {
            await db.put({
                _id: datum.key,
                url: datum.value._pouchData.url,
                content: {
                    title: datum.value._pouchData.title,
                },
            })
        } else if (
            !datum.key.beginsWith(visitKeyPrefix) &&
            !datum.key.beginsWith(bookmarkKeyPrefix)
        ) {
            try {
                datum.value = new Map(datum.value)
            } catch (err) {
                console.log(err)
            }
        }
        await idb.put(datum.key, datum.value, err => {
            console.log(err)
        })
    }
}

window.exportIndex = exportIndex
window.importIndex = importIndex
