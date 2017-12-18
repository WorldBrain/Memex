import index from 'src/search/search-index'

const db = index.db._db

async function downloadChunk(data, counter) {
    chrome.downloads.download({
        url: URL.createObjectURL(
            new Blob([JSON.stringify(data)], { type: 'text/plain' }),
        ),
        filename: 'worldbrain_index_'.concat(counter, '.json'),
        saveAs: false,
    })
}

async function grabDBChunk(startAfter = '', limit = 1000) {
    const data = []

    return new Promise((resolve, reject) =>
        db
            .createReadStream({ gt: startAfter, limit })
            .on('data', datum => data.push(datum))
            .on('error', reject)
            .on('end', () => resolve(data)),
    )
}

/**
 * @param {int} chunkSize Length of the chunk for piecewise export 
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
    data.forEach(datum => {
        db.put(datum.key, datum.value, err => {
            console.log(err)
        })
    })
}

window.exportIndex = exportIndex
window.importIndex = importIndex
