import initBatch from 'src/util/promise-batcher'
import { storePageFromUrl } from 'src/page-storage/store-page'
import { updatePageSearchIndex } from 'src/search/find-pages'
import importHistory, { getHistoryEstimates } from './import-history'
import {
    lastImportTimeStorageKey, importProgressStorageKey,
    setImportDocStatus, getImportDocs, removeImportDocs,
} from './'


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

const getLastImportTime = async () =>
    (await browser.storage.local.get(lastImportTimeStorageKey))[lastImportTimeStorageKey]

const getImportInProgressFlag = async () =>
    (await browser.storage.local.get(importProgressStorageKey))[importProgressStorageKey]

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
    async complete() {
        // Final reindexing so that all the finished docs are searchable
        await updatePageSearchIndex()

        // Tell UI that it's finished
        port.postMessage({ cmd: 'COMPLETE' })

        // Remove import in progress flag
        browser.storage.local.remove(importProgressStorageKey)
    },
})

/**
 * Handles calculating the estimate counts for history and bookmark imports.
 * @returns {any} The state containing import estimates completed and remaining counts.
 */
async function getEstimateCounts() {
    // Check if the importHistory stage was run previously to search history from that time
    const startTime = await getLastImportTime()

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

/**
 * Handles passing the input (pending import docs) to the batcher so that it can process.
 * @param {any} batch The promise batcher instance.
 */
async function initBatchWithImportDocs(batch) {
    // Grab existing and newly created import docs and init the batcher with them
    const { docs: importDocs } = await getImportDocs()
    batch.init(getPendingInputs(importDocs))
}

/**
 * Essentially the logic which happens when the user presses the "Start Import" button.
 * @param {any} batch The init'd batcher to init with input and then start.
 */
async function startImport(port, batch) {
    // Check if the importHistory stage was run previously to search history from that time
    const startTime = await getLastImportTime()

    // Perform history-stubs, vists, and history import docs creation, if import not in progress
    const importInProgress = await getImportInProgressFlag()
    if (!importInProgress) {
        await importHistory({ startTime })
    }

    port.postMessage({ cmd: 'START' })

    // Set the new importHistory timestamp in local storage for next import
    browser.storage.local.set({ [lastImportTimeStorageKey]: Date.now() })

    // Set the new import in progress flag to avoid expensive logic next time
    browser.storage.local.set({ [importProgressStorageKey]: true })

    await initBatchWithImportDocs(batch)

    // Start the batcher
    batch.start()
}

const getCmdMessageHandler = (port, batch) => async ({ cmd }) => {
    switch (cmd) {
        case 'START': return await startImport(port, batch)
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

    const batch = initBatch({
        asyncCallback: storePageFromUrl,
        concurrency: 5,
        observer: getBatchObserver(port),
    })

    // If import isn't started earlier, get estimates and set view state to init
    const importInProgress = await getImportInProgressFlag()
    if (!importInProgress) {
        // Get import estimate counts and send them down to UI
        const estimateCounts = await getEstimateCounts()
        port.postMessage({ cmd: 'INIT', ...estimateCounts })
    } else {
        // If import is in progress, we need to make sure it's input is ready to process again
        await initBatchWithImportDocs(batch)
        // Make sure to start the view in paused state
        port.postMessage({ cmd: 'PAUSE' })
    }


    // Handle any incoming messages to control the batch
    const cmdMessageHandler = getCmdMessageHandler(port, batch)
    port.onMessage.addListener(cmdMessageHandler)
}
