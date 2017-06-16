import initBatch from 'src/util/promise-batcher'
import { CMDS, IMPORT_CONN_NAME } from 'src/options/imports/constants'
import prepareImports, { getEstimateCounts } from './imports-preparation'
import processImportItem from './import-doc-processor'
import { importProgressStorageKey, getImportItems, removeImportItem, clearImportItems } from './'


// Local storage helpers to make the main functions a bit less messy
const getImportInProgressFlag = async () =>
    (await browser.storage.local.get(importProgressStorageKey))[importProgressStorageKey]
const setImportInProgressFlag = async () =>
    (await browser.storage.local.set({ [importProgressStorageKey]: true }))
const clearImportInProgressFlag = async () =>
    await browser.storage.local.remove(importProgressStorageKey)

/**
 * Creates observer functions to afford sending of messages over connection port
 * to UI on certain batcher events. Note that next (success) and error handlers are pretty
 * much the same; they either contain error or output/status keys, which UI handles if present.
 *
 * @param {Port} port The open connection port to send messages over.
 */
const getBatchObserver = port => {
    const handleFinishedItem = ({ input: { url, type }, output, error }) => {
        // Send item data + outcome status down to UI (and error if present)
        port.postMessage({ cmd: CMDS.NEXT, url, type, status: output, error })

        removeImportItem(url)
    }

    return {
        // Triggers on the successful finish of each batch input
        next: handleFinishedItem,
        // Triggers on any error thrown during the processing of each input
        error: handleFinishedItem,
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
        await prepareImports(allowTypes)
    }

    // Tell UI to finish loading state and move into progress view
    port.postMessage({ cmd: CMDS.START })

    setImportInProgressFlag()

    // Start the batcher with needed input
    batch.init(await getImportItems())
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

    const batch = initBatch({
        asyncCallback: processImportItem,
        concurrency: 5,
        observer: getBatchObserver(port),
    })

    // If import isn't started earlier, get estimates and set view state to init
    const importInProgress = await getImportInProgressFlag()
    if (!importInProgress) {
        // Make sure estimates view init'd with count data
        const estimateCounts = await getEstimateCounts()
        port.postMessage({ cmd: CMDS.INIT, ...estimateCounts })
    } else {
        // If import is in progress, we need to make sure it's input is ready to process again
        batch.init(await getImportItems())
        // Make sure to start the view in paused state
        port.postMessage({ cmd: CMDS.PAUSE })
    }

    // Handle any incoming messages to control the batch
    port.onMessage.addListener(async ({ cmd, ...payload }) => {
        switch (cmd) {
            case CMDS.START: return await startImport(port, batch, payload)
            case CMDS.RESUME: return batch.start()
            case CMDS.PAUSE: return batch.pause()
            case CMDS.CANCEL: return await cancelImport(port, batch)
            case CMDS.FINISH: return await finishImport(port)
            default: return console.error(`unknown command: ${cmd}`)
        }
    })
}
