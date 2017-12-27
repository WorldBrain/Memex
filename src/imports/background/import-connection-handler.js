import { CMDS, DEF_CONCURRENCY } from 'src/options/imports/constants'
import stateManager from './import-state'
import ProgressManager from './import-progress'

export default class ImportConnectionHandler {
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
        // If import isn't already running, get estimates and set view state to init...
        const importInProgress = await this.importer.getImportInProgressFlag()

        if (!importInProgress) {
            // Make sure estimates view init'd with count data
            const estimateCounts = await stateManager.fetchEsts()
            this.port.postMessage({ cmd: CMDS.INIT, ...estimateCounts })
        } else {
            // ... else make sure to start UI in paused state
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

    /**
     * Main message listener that handles any messages sent from the UI script.
     */
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
            case CMDS.SET_PROCESS_ERRS:
                return (this.importer.processErrors = payload)
            default:
                return console.error(`unknown command: ${cmd}`)
        }
    }

    /**
     * @param {any} allowTypes Object with keys as valid import types pointing to bool values denoting whether
     * or not to process that given type of imports.
     */
    async startImport(allowTypes) {
        stateManager.allowTypes = allowTypes

        // Perform history-stubs, vists, and history import state creation, if import not in progress
        const importInProgress = await this.importer.getImportInProgressFlag()
        if (!importInProgress) {
            await stateManager.fetchEsts()
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
        const estimateCounts = await stateManager.fetchEsts()
        this.port.postMessage({ cmd: CMDS.INIT, ...estimateCounts })
    }

    async cancelImport() {
        this.importer.stop()
        this.importer.setImportInProgressFlag(false)

        // Resume UI at complete state
        this.port.postMessage({ cmd: CMDS.COMPLETE })
    }
}
