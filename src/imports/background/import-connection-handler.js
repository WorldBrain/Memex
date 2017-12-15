import {
    CMDS,
    IMPORT_CONN_NAME,
    DEF_CONCURRENCY,
    IMPORT_TYPE,
} from 'src/options/imports/constants'
import { differMaps } from 'src/util/map-set-helpers'
import getEstimateCounts from './import-estimates'
import processImportItem from './import-item-processor'
import stateManager from './import-state'
import createImportItems from './import-item-creation'
import {
    getImportInProgressFlag,
    setImportInProgressFlag,
    clearImportInProgressFlag,
} from '../'
import ProgressManager from './import-progress'

/**
 * Handles building the collection of import items in local storage.
 *
 * @param {any} allowTypes Object containings bools for each valid type of import, denoting whether
 *   or not import and page docs should be created for that import type.
 */
async function prepareImportItems(allowTypes = {}) {
    let bookmarkItems

    for await (let { data, type } of createImportItems()) {
        if (type === IMPORT_TYPE.BOOKMARK) {
            // Bookmarks should always yield before history
            bookmarkItems = data
        } else if (type === IMPORT_TYPE.HISTORY) {
            // Don't include pages in history that exist as bookmarks as well
            data = differMaps(bookmarkItems)(data)
        }

        if (allowTypes[type]) {
            await stateManager.addItems(data)
        }
    }
}

/**
 * Essentially the logic which happens when the user presses the "Start Import" button.
 *
 * @param {Port} port The open connection port to send messages over.
 * @param {ImportProgressManager} importer The progress maanger instance to start.
 * @param {any} allowTypes Object with keys as valid import types pointing to bool values denoting whether
 * or not to process that given type of imports.
 */
async function startImport(port, importer, allowTypes) {
    // Perform history-stubs, vists, and history import state creation, if import not in progress
    const importInProgress = await getImportInProgressFlag()
    if (!importInProgress) {
        await prepareImportItems(allowTypes)
    }

    port.postMessage({ cmd: CMDS.START }) // Tell UI to finish loading state and move into progress view
    setImportInProgressFlag()
    importer.start()
}

/**
 * The cleanup logic that happens when user chooses to finish an import
 * (either after completion or cancellation).
 */
async function finishImport(port) {
    clearImportInProgressFlag()

    // Re-init the estimates view with updated estimates data
    const estimateCounts = await getEstimateCounts({ forceRecalc: true })
    port.postMessage({ cmd: CMDS.INIT, ...estimateCounts })
}

async function cancelImport(port, importer) {
    importer.stop()

    // Clean up any import-related stubs or state
    await stateManager.clearItems()

    // Resume UI at complete state
    port.postMessage({ cmd: CMDS.COMPLETE })
    clearImportInProgressFlag()
}

/**
 * Binds the chunk processor logic to the UI connection port, to allow progress to be reported from within.
 *
 * @param {Port} port
 */
const processChunk = port =>
    /**
     * @param {any} chunkData The data of currently-being-processed chunk (contains `chunk` and `chunkKey`).
     * @param {number} concurrency Externally-specified concurrency level to use to implement concurrency (TODO).
     * @param {any} token Token object to allow attaching of rejection callback, affording caller Promise cancellation.
     */
    async function({ chunk, chunkKey }, concurrency, token) {
        for (const [encodedUrl, importItem] of Object.entries(chunk)) {
            let status, url, error
            try {
                const processingResult = await processImportItem(
                    importItem,
                    token,
                )
                status = processingResult.status
            } catch (err) {
                // Throw execution was cancelled, throw error up the stack
                if (err.cancelled) {
                    throw err
                }
                error = err.message
            } finally {
                // Send item data + outcome status down to UI (and error if present)
                port.postMessage({
                    cmd: CMDS.NEXT,
                    url: url,
                    type: importItem.type,
                    status,
                    error,
                })
                await stateManager.removeItem(chunkKey, encodedUrl)
            }
        }
    }

/**
 * Main connection handler to handle background importing and fetch&analysis batching
 * logic via commands issued from the UI.
 */
export default async function importsConnectionHandler(port) {
    // Make sure to only handle connection logic for imports (allows other use of runtime.connect)
    if (port.name !== IMPORT_CONN_NAME) return

    console.log('importer connected')

    const importer = new ProgressManager(processChunk(port), DEF_CONCURRENCY)

    // If import isn't started earlier, get estimates and set view state to init
    const importInProgress = await getImportInProgressFlag()
    if (!importInProgress) {
        // Make sure estimates view init'd with count data
        const estimateCounts = await getEstimateCounts({ forceRecalc: false })
        port.postMessage({ cmd: CMDS.INIT, ...estimateCounts })
    } else {
        // Make sure to start the view in paused state
        port.postMessage({ cmd: CMDS.PAUSE })
    }

    // Handle any incoming messages to control theimporter
    port.onMessage.addListener(async ({ cmd, payload }) => {
        switch (cmd) {
            case CMDS.START:
                return await startImport(port, importer, payload)
            case CMDS.RESUME:
                return importer.start()
            case CMDS.PAUSE:
                return importer.stop()
            case CMDS.CANCEL:
                return await cancelImport(port, importer)
            case CMDS.FINISH:
                return await finishImport(port)
            case CMDS.SET_CONCURRENCY:
                return (importer.concurrency = payload)
            default:
                return console.error(`unknown command: ${cmd}`)
        }
    })
}
