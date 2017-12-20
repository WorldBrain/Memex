import promiseLimit from 'promise-limit'

import { indexQueue } from 'src/search/search-index'
import stateManager from './import-state'
import ItemProcessor from './import-item-processor'

class ImportProgressManager {
    static IMPORTS_PROGRESS_KEY = 'is-imports-in-progress'
    static CONCURR_LIMIT = 10

    /**
     * @property {ItemProcessor[]} Currently scheduled processor instances, affording control over execution.
     */
    processors = []

    /**
     * @property {number} Currently set level of concurrency.
     */
    _concurrency

    /**
     * @property {any} Object containing `next` and `complete` methods to run after each item and when
     *  all items complete, respecitively.
     */
    observer

    /**
     * @property {boolean} Flag denoting whether or not current state is stopped or not.
     */
    stopped = false

    constructor(initConcurrency, initObserver) {
        this.concurrency = initConcurrency
        this.observer = initObserver
    }

    set concurrency(value) {
        if (value > 0 && value <= ImportProgressManager.CONCURR_LIMIT) {
            this._concurrency = value
            // Update Promise concurrency affording functionality
            this.runConcurrent = promiseLimit(value)
        }
    }

    async getImportInProgressFlag() {
        const {
            [ImportProgressManager.IMPORTS_PROGRESS_KEY]: flag,
        } = await browser.storage.local.get({
            [ImportProgressManager.IMPORTS_PROGRESS_KEY]: false,
        })

        return flag
    }

    async setImportInProgressFlag(value) {
        return await browser.storage.local.set({
            [ImportProgressManager.IMPORTS_PROGRESS_KEY]: value,
        })
    }

    /**
     * Get next available processor index.
     *
     * @returns {number} Index between 0 and `this._concurrency`.
     */
    nextProcIndex() {
        for (let i = 0; i < this._concurrency; i++) {
            const proc = this.processors[i]

            // Take current spot if empty or saved processor is in finished state
            if (proc == null || proc.finished) {
                return i
            }
        }

        return 0 // Base case; should not be reached
    }

    /**
     * Start execution
     */
    async start() {
        this.stopped = false

        // Iterate through data chunks from the state manager
        for await (const { chunk, chunkKey } of stateManager.getItems()) {
            try {
                const importItemEntries = Object.entries(chunk)
                const processEntry = this.processItem(chunkKey)

                // For each chunk, run through the import item entries at specified level of concurrency
                await this.runConcurrent.map(importItemEntries, processEntry)
            } catch (err) {
                // If execution cancelled break Iterator processing
                if (err.cancelled) {
                    break
                }
                console.error(err)
            }
        }

        if (!this.stopped) {
            // Notify observer that we're done!
            this.observer.complete()
        }
    }

    /**
     * Goes through each processor and runs the `cancel` method.
     * Processor state is cleared afterwards.
     */
    stop() {
        this.stopped = true

        // Run processors' cancal methods to stop running async logic, then wipe references
        this.processors.forEach(proc => proc != null && proc.cancel())
        this.processors = []

        // Ensure index queue is cleared so queued up item's indexing doesn't happen
        indexQueue.clear()
    }

    /**
     * @param {string} chunkKey The key of the chunk currently being processed.
     * @returns {(chunkEntry) => Promise<void>} Async function affording processing of single entry in chunk.
     */
    processItem = chunkKey => async ([encodedUrl, importItem]) => {
        const processor = new ItemProcessor()

        // Used to build the message to send to observer
        const msg = {
            type: importItem.type,
            url: importItem.url,
        }

        try {
            if (this.stopped) {
                throw ItemProcessor.makeInterruptedErr()
            }

            // Save reference to processor for cancelling later
            this.processors[this.nextProcIndex()] = processor
            const res = await processor.process(importItem)
            msg.status = res.status
        } catch (err) {
            // Throw execution was cancelled, throw error up the stack
            if (err.cancelled) {
                throw err
            }
            msg.error = err.message
        } finally {
            processor.finished = true

            // Send item data + outcome status down to UI (and error if present)
            if (!processor.cancelled) {
                this.observer.next(msg)

                // Either flag as error or remove from state depending on processing error status
                if (msg.error) {
                    await stateManager.flagAsError(chunkKey, encodedUrl)
                } else {
                    await stateManager.removeItem(chunkKey, encodedUrl)
                }
            }
        }
    }
}

export default ImportProgressManager
