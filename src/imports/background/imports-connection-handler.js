import PromiseBatcher from 'src/util/promise-batcher'
import { decode } from 'src/util/encode-url-for-id'
import {
    CMDS,
    IMPORT_CONN_NAME,
    IMPORT_TYPE,
} from 'src/options/imports/constants'
import getEstimateCounts from './import-estimates'
import processImportItem from './import-item-processor'
import {
    getImportItems,
    setImportItems,
    getURLFilteredHistoryItems,
    getURLFilteredBookmarkItems,
    getOldExtItems,
    removeImportItem,
    clearImportItems,
} from './'
import {
    getImportInProgressFlag,
    setImportInProgressFlag,
    clearImportInProgressFlag,
} from '../'

/**
 * Handles building the collection of import items in local storage.
 *
 * @param {any} allowTypes Object containings bools for each valid type of import, denoting whether
 *   or not import and page docs should be created for that import type.
 */
async function prepareImportItems(allowTypes = {}) {
    const historyItemsMap = allowTypes[IMPORT_TYPE.HISTORY]
        ? await getURLFilteredHistoryItems()
        : new Map()
    const bookmarkItemsMap = allowTypes[IMPORT_TYPE.BOOKMARK]
        ? await getURLFilteredBookmarkItems()
        : new Map()
    const oldExtItemsMap = allowTypes[IMPORT_TYPE.OLD]
        ? (await getOldExtItems()).importItemsMap
        : new Map()

    // Union all import item maps, allowing old ext items precedence over bookmarks which have
    //  precedence over history
    await setImportItems(
        new Map([...historyItemsMap, ...bookmarkItemsMap, ...oldExtItemsMap]),
    )
}

/**
 * Creates observer functions to afford sending of messages over connection port
 * to UI on certain batcher events. Note that next (success) and error handlers are pretty
 * much the same; they either contain error or output/status keys, which UI handles if present.
 *
 * @param {Port} port The open connection port to send messages over.
 */
const getBatchObserver = port => {
    const handleFinishedItem = ({
        input: [encodedUrl, { type }],
        output: { status } = {},
        error,
    }) => {
        // Send item data + outcome status down to UI (and error if present)
        port.postMessage({
            cmd: CMDS.NEXT,
            url: decode(encodedUrl),
            type,
            status,
            error,
        })

        removeImportItem(encodedUrl)
    }

    return {
        // Triggers on any error thrown during the processing of each input
        error: handleFinishedItem,
        // Triggers on the successful finish of each batch input
        next: handleFinishedItem,
        // Triggers when ALL batch inputs are finished
        async complete() {
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
        concurrency: 3,
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
            case CMDS.RESUME:
                return batch.start()
            case CMDS.PAUSE:
                return batch.stop()
            case CMDS.CANCEL:
                return await cancelImport(port, batch)
            case CMDS.FINISH: {
                console.timeEnd('total-import-time')
                return await finishImport(port)
            }
            default:
                return console.error(`unknown command: ${cmd}`)
        }
    })
}
