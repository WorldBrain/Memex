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

class ImportConnectionHandler {
    /**
     * @property {runtime.Port} Runtime connection port to afford message communication with UI script
     */
    port

    /**
     * @property {ImportProgressManager} Importer instance
     */
    importer

    constructor(port) {
        this.port = port

        this.importer = new ProgressManager(this.processChunk, DEF_CONCURRENCY)

        // Handle any incoming messages to control theimporter
        port.onMessage.addListener(this.messageListener)

        this.attemptRehydrate()
    }

    async attemptRehydrate() {
        // If import isn't started earlier, get estimates and set view state to init
        const importInProgress = await getImportInProgressFlag()
        if (!importInProgress) {
            // Make sure estimates view init'd with count data
            const estimateCounts = await getEstimateCounts({
                forceRecalc: false,
            })
            this.port.postMessage({ cmd: CMDS.INIT, ...estimateCounts })
        } else {
            // Make sure to start the view in paused state
            this.port.postMessage({ cmd: CMDS.PAUSE })
        }
    }

    messageListener = ({ cmd, payload }) => {
        switch (cmd) {
            case CMDS.START:
                return this.startImport(payload)
            case CMDS.RESUME:
                return this.importer.start()
            case CMDS.PAUSE:
                return this.importer.stop()
            case CMDS.CANCEL:
                return this.cancelImport()
            case CMDS.FINISH:
                return this.finishImport()
            case CMDS.SET_CONCURRENCY:
                return (this.importer.concurrency = payload)
            default:
                return console.error(`unknown command: ${cmd}`)
        }
    }

    /**
     * @param {any} chunkData The data of currently-being-processed chunk (contains `chunk` and `chunkKey`).
     * @param {number} concurrency Externally-specified concurrency level to use to implement concurrency (TODO).
     * @param {any} token Token object to allow attaching of rejection callback, affording caller Promise cancellation.
     */
    processChunk = async ({ chunk, chunkKey }, concurrency, token) => {
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
                this.port.postMessage({
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
     * Handles building the collection of import items in local storage.
     *
     * @param {any} allowTypes Object containings bools for each valid type of import, denoting whether
     *   or not import and page docs should be created for that import type.
     */
    async prepareImportItems(allowTypes = {}) {
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
     * @param {any} allowTypes Object with keys as valid import types pointing to bool values denoting whether
     * or not to process that given type of imports.
     */
    async startImport(allowTypes) {
        // Perform history-stubs, vists, and history import state creation, if import not in progress
        const importInProgress = await getImportInProgressFlag()
        if (!importInProgress) {
            await this.prepareImportItems(allowTypes)
        }

        this.port.postMessage({ cmd: CMDS.START }) // Tell UI to finish loading state and move into progress view
        setImportInProgressFlag()
        this.importer.start()
    }

    /**
     * The cleanup logic that happens when user chooses to finish an import
     * (either after completion or cancellation).
     */
    async finishImport() {
        clearImportInProgressFlag()

        // Re-init the estimates view with updated estimates data
        const estimateCounts = await getEstimateCounts({ forceRecalc: true })
        this.port.postMessage({ cmd: CMDS.INIT, ...estimateCounts })
    }

    async cancelImport() {
        this.importer.stop()

        // Clean up any import-related stubs or state
        await stateManager.clearItems()

        // Resume UI at complete state
        this.port.postMessage({ cmd: CMDS.COMPLETE })
        clearImportInProgressFlag()
    }
}

/**
 * Main connection handler to handle background importing and fetch&analysis batching
 * logic via commands issued from the UI.
 *
 * @param {runtime.Port} port Object passed from API event.
 * @returns {ImportConnectionHandler}
 */
export default function importsConnectionHandler(port) {
    // Make sure to only handle connection logic for imports (allows other use of runtime.connect)
    if (port.name !== IMPORT_CONN_NAME) return

    console.log('importer connected')

    return new ImportConnectionHandler(port)
}
