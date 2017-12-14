import stateManager from './import-state'

class ImportProgressManager {
    static STATE_STORAGE_KEY = 'import-running-state'
    static CONCURR_LIMIT = 5

    /**
     * @property {any} Token object to afford cancellation of currently running Promises.
     */
    token = {}

    /**
     * @property {number} Level of concurrency for passing to `chunkProcessor`
     */
    _concurrency

    /**
     * @property {(chunkData: any) => Promise<void>} Async function to process each state chunk's data
     */
    chunkProcessor

    constructor(initProcessor, initConcurrency) {
        this.chunkProcessor = initProcessor
        this.concurrency = initConcurrency
    }

    set concurrency(value) {
        if (value > 0 && value <= ImportProgressManager.CONCURR_LIMIT) {
            this._concurrency = value
        }
    }

    /**
     * Start execution
     */
    async start() {
        // Iterate through data chunks from the state manager
        for await (const chunkData of stateManager.getItems()) {
            try {
                // Run the chunk processor on the current data, passing in needed state
                await this.chunkProcessor(
                    chunkData,
                    this._concurrency,
                    this.token,
                )
            } catch (err) {
                // If execution cancelled break Iterator processing
                if (err.cancelled) {
                    break
                }
                console.error(err)
            }
        }
    }

    stop() {
        if (typeof this.token.cancel === 'function') {
            // Create error with `cancelled` bool property to distinguish in callers
            const err = new Error('Stopping progress')
            err.cancelled = true

            // Run token's cancal callback to stop async `chunkProcessor` logic running
            this.token.cancel(err)
        }
    }
}

export default ImportProgressManager
