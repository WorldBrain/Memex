import initBatch from 'src/util/promise-batcher'
import { storePageFromUrl } from 'src/page-storage/store-page'
import importHistory, { getHistoryEstimates } from './import-history'
import { lastImportTimeStorageKey, setImportDocStatus, getImportDocs } from './'


const genericCount = { history: 0, bookmark: 0 }
const initCounts = { totals: genericCount, fail: genericCount, success: genericCount }

const getImportCounts = docs => docs.reduce((acc, doc) => ({
    totals: { ...acc.totals, [doc.type]: acc.totals[doc.type] + 1 },
    fail: { ...acc.fail, [doc.type]: acc.fail[doc.type] + (doc.status === 'fail' ? 1 : 0) },
    success: { ...acc.success, [doc.type]: acc.success[doc.type] + (doc.status === 'success' ? 1 : 0) },
}), initCounts)

const getPendingInputs = importDocs => importDocs
    .filter(doc => doc.status === 'pending')
    .map(doc => ({ url: doc.url, importDocId: doc._id }))

/**
 * Creates observer functions to afford sending of messages over connection port
 * to UI on certain batcher events.
 *
 * @param {Port} port The open connection port to send messages over.
 */
const getBatchObserver = port => ({
    // Triggers on the successful finish of each batch input
    next({ input: { url, importDocId } }) {
        // Send success data to listener
        port.postMessage({ cmd: 'NEXT', url })
        setImportDocStatus(importDocId, 'success')
    },
    // Triggers on any error during the processing of each batch input
    error({ input: { url, importDocId }, error }) {
        // Send error data to listener
        port.postMessage({ cmd: 'NEXT', url, error })
        setImportDocStatus(importDocId, 'fail')
    },
    // Triggers after all inputs have been batch processed, regardless of success
    complete: () => port.postMessage({ cmd: 'COMPLETE' }),
})

/**
 * Handles all needed preliminary logic before the user-controlled batch imports process
 * can begin. Currently handles generation of page and corresponding visit docs for all
 * browser history.
 */
async function preliminaryImports() {
    // Check if the importHistory stage was run previously to search history from that time
    const startTime = (await browser.storage.local.get(lastImportTimeStorageKey))[lastImportTimeStorageKey]
    await importHistory({ startTime })

    // Set the new importHistory timestamp in local storage for next import
    browser.storage.local.set({ [lastImportTimeStorageKey]: Date.now() })
}

/**
 * Handles calculating the estimate counts for history and bookmark imports.
 * @returns {any} The state containing import estimates completed and remaining counts.
 */
async function getEstimateCounts() {
    // Check if the importHistory stage was run previously to search history from that time
    const startTime = (await browser.storage.local.get(lastImportTimeStorageKey))[lastImportTimeStorageKey]

    const { completed: histCompleted, remaining: histRemaining } = await getHistoryEstimates({ startTime })
    // TODO: switch this with async getBookmarkEstimates call when implemented
    const bmCompleted = 10
    const bmRemaining = 0

    return {
        completed: {
            history: histCompleted,
            bookmark: bmCompleted,
        },
        remaining: {
            history: histRemaining,
            bookmark: bmRemaining,
        },
    }
}

const getCmdMessageHandler = batch => ({ cmd }) => {
    switch (cmd) {
        case 'START':
        case 'RESUME': return batch.start()
        case 'PAUSE': return batch.pause()
        case 'STOP': return batch.stop()
        default: return console.error(`unknown command: ${cmd}`)
    }
}

/**
 * Main connection handler to handle background importing and fetch&analysis batching
 * logic via commands issued from the UI.
 */
export default async function importsConnectionHandler(port) {
    // Make sure to only handle connection logic for imports (allows other use of runtime.connect)
    if (port.name !== 'imports') return

    console.log('importer connected')

    // Get import estimate counts and send them down to UI
    const estimateCounts = await getEstimateCounts()
    port.postMessage({ cmd: 'INIT', ...estimateCounts })

    const batch = initBatch({
        inputBatch: getPendingInputs(importDocs),
        asyncCallback: storePageFromUrl,
        concurrency: 5,
        observer: getBatchObserver(port),
    })

    // Handle any incoming messages to control the batch
    const cmdMessageHandler = getCmdMessageHandler(batch)
    port.onMessage.addListener(cmdMessageHandler)
}
