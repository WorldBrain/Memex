import {
    CMDS,
    IMPORT_CONN_NAME,
    DEF_CONCURRENCY,
    IMPORT_TYPE,
} from 'src/options/imports/constants'
import { differMaps } from 'src/util/map-set-helpers'
import getEstimateCounts from './import-estimates'
import stateManager from './import-state'
import createImportItems from './import-item-creation'
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
        // Main `runtime.Port` that this class hides away to handle connection with the imports UI script
        this.port = port

        // Initialize the `ProgressManager` to run the import processing logic on import items state
        this.importer = new ProgressManager(DEF_CONCURRENCY, this.itemObserver)

        // Handle any incoming UI messages to control the importer
        port.onMessage.addListener(this.messageListener)

        // Handle UI disconnection by stopping (pausing) progress
        port.onDisconnect.addListener(() => this.importer.stop())

        this.attemptRehydrate()
    }

    async attemptRehydrate() {
        // If import isn't started earlier, get estimates and set view state to init
        const importInProgress = await this.importer.getImportInProgressFlag()

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

    /**
     * Object containing `next` and `complete` methods for the `ProgressManager` to
     * pass messages back along the connection as it observes import items finishing
     * (currently used to send item data for display in the UI).
     */
    itemObserver = {
        next: msg => this.port.postMessage({ cmd: CMDS.NEXT, ...msg }),
        complete: () => this.port.postMessage({ cmd: CMDS.COMPLETE }),
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
        const importInProgress = await this.importer.getImportInProgressFlag()
        if (!importInProgress) {
            await this.prepareImportItems(allowTypes)
        }

        this.port.postMessage({ cmd: CMDS.START }) // Tell UI to finish loading state and move into progress view

        this.importer.setImportInProgressFlag(true)
        this.importer.start()
    }

    /**
     * The cleanup logic that happens when user chooses to finish an import
     * (either after completion or cancellation).
     */
    async finishImport() {
        this.importer.setImportInProgressFlag(false)

        // Re-init the estimates view with updated estimates data
        const estimateCounts = await getEstimateCounts({ forceRecalc: true })
        this.port.postMessage({ cmd: CMDS.INIT, ...estimateCounts })
    }

    async cancelImport() {
        this.importer.stop()
        this.importer.setImportInProgressFlag(false)

        // Clean up any import-related stubs or state
        await stateManager.clearItems()

        // Resume UI at complete state
        this.port.postMessage({ cmd: CMDS.COMPLETE })
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
