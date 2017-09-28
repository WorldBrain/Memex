import uniqBy from 'lodash/fp/uniqBy'

import PromiseBatcher from 'src/util/promise-batcher'
import { CMDS, IMPORT_CONN_NAME, IMPORT_TYPE } from 'src/options/imports/constants'
import getEstimateCounts from './import-estimates'
import processImportItem from './import-item-processor'
import {
    getImportItems, setImportItems,
    getURLFilteredHistoryItems, getURLFilteredBookmarkItems,
    removeImportItem, clearImportItems,
} from './'
import {
    getImportInProgressFlag, setImportInProgressFlag,
    clearImportInProgressFlag,
} from '../'

const uniqByUrl = uniqBy('url')

// Binds an import type to a function that transforms a history/bookmark doc to an import item.
const transformToImportItem = type => item => ({
    browserId: item.id,
    url: item.url,
    // HistoryItems contain lastVisitTime while BookmarkTreeNodes contain dateAdded
    timestamp: item.lastVisitTime || item.dateAdded,
    type,
})

/**
 * Handles building the list of import items in local storage. Note that these are only
 * built in local storage as a way to persist them.
 * @param {any} allowTypes Object containings bools for each valid type of import, denoting whether
 *   or not import and page docs should be created for that import type.
 */
async function prepareImportItems(allowTypes = {}) {
    const historyItems = allowTypes[IMPORT_TYPE.HISTORY] ? await getURLFilteredHistoryItems() : []
    const bookmarkItems = allowTypes[IMPORT_TYPE.BOOKMARK] ? await getURLFilteredBookmarkItems() : []

    // Create import items for all created page stubs
    await setImportItems(uniqByUrl([
        ...historyItems.map(transformToImportItem(IMPORT_TYPE.HISTORY)),
        ...bookmarkItems.map(transformToImportItem(IMPORT_TYPE.BOOKMARK)),
    ]))
}

/**
 * Creates observer functions to afford sending of messages over connection port
 * to UI on certain batcher events. Note that next (success) and error handlers are pretty
 * much the same; they either contain error or output/status keys, which UI handles if present.
 *
 * @param {Port} port The open connection port to send messages over.
 */
const getBatchObserver = port => {
    const handleFinishedItem = ({ input: { url, type }, output: { status } = {}, error }) => {
        // Send item data + outcome status down to UI (and error if present)
        port.postMessage({ cmd: CMDS.NEXT, url, type, status, error })

        removeImportItem(url)
    }

    return {
        // Triggers on any error thrown during the processing of each input
        error: handleFinishedItem,
        // Triggers on the successful finish of each batch input
        next: handleFinishedItem,
        // Triggers when ALL batch inputs are finished
        async complete() {
            // TODO: Final reindexing so that all the finished docs are searchable

            // Tell UI that it's finished
            port.postMessage({ cmd: CMDS.COMPLETE })
            clearImportInProgressFlag()
        },
    }
}

/**
 * Essentially the logic which happens when the user presses the "Start Import" button.
 *
 * @param {Port} port The open connection port to send messages over.
 * @param {any} batch The init'd batcher to init with input and then start.
 * @param {any} allowTypes Object with keys as valid import types pointing to bool values denoting whether
 * or not to process that given type of imports.
 */
async function startImport(port, batch, allowTypes) {
    // Perform history-stubs, vists, and history import state creation, if import not in progress
    const importInProgress = await getImportInProgressFlag()
    if (!importInProgress) {
        await prepareImportItems(allowTypes)
    }

    port.postMessage({ cmd: CMDS.START }) // Tell UI to finish loading state and move into progress view
    setImportInProgressFlag()
    batch.start()
}

/**
 * The cleanup logic that happens when user chooses to finish an import
 * (either after completion or cancellation).
 */
async function finishImport(port) {
    clearImportInProgressFlag()

    // Re-init the estimates view with updated estimates data
    const estimateCounts = await getEstimateCounts()
    port.postMessage({ cmd: CMDS.INIT, ...estimateCounts })
}

async function cancelImport(port, batch) {
    batch.stop()

    // Clean up any import-related stubs or state
    await clearImportItems()

    // TODO: Make sure to reindex so that the progress up until cancelled point is usable

    // Resume UI at complete state
    port.postMessage({ cmd: CMDS.COMPLETE })
    clearImportInProgressFlag()
}

/**
 * Main connection handler to handle background importing and fetch&analysis batching
 * logic via commands issued from the UI.
 */
export default async function importsConnectionHandler(port) {
    // Make sure to only handle connection logic for imports (allows other use of runtime.connect)
    if (port.name !== IMPORT_CONN_NAME) return

    console.log('importer connected')

    const batch = new PromiseBatcher({
        inputBatchCallback: getImportItems,
        processingCallback: processImportItem,
        concurrency: 1,
        observer: getBatchObserver(port),
    })

    // If import isn't started earlier, get estimates and set view state to init
    const importInProgress = await getImportInProgressFlag()
    if (!importInProgress) {
        // Make sure estimates view init'd with count data
        const estimateCounts = await getEstimateCounts()
        port.postMessage({ cmd: CMDS.INIT, ...estimateCounts })
    } else {
        // Make sure to start the view in paused state
        port.postMessage({ cmd: CMDS.PAUSE })
    }

    // Handle any incoming messages to control the batch
    port.onMessage.addListener(async ({ cmd, ...payload }) => {
        switch (cmd) {
            case CMDS.START: {
                console.time('total-import-time') 
                return await startImport(port, batch, payload)
            }
            case CMDS.RESUME: return batch.start()
            case CMDS.PAUSE: return batch.stop()
            case CMDS.CANCEL: return await cancelImport(port, batch)
            case CMDS.FINISH: {
                console.timeEnd('total-import-time')
                return await finishImport(port)
            }
            default: return console.error(`unknown command: ${cmd}`)
        }
        
    })
}
