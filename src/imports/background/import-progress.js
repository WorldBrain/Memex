import promiseLimit from 'promise-limit'

import { indexQueue } from 'src/search'
import stateManager from './import-state'
import ItemProcessor from './import-item-processor'

class ImportProgressManager {
    static IMPORTS_PROGRESS_KEY = 'is-imports-in-progress'
    static CONCURR_LIMIT = 20

    /**
     * @property {ItemProcessor[]} Currently scheduled processor instances, affording control over execution.
     */
    processors = []

    /**
     * @property {number} Currently set level of concurrency.
     */
    _concurrency

    /**
     * @property {boolean} Currently set preference for including previously error'd items in import.
     */
    processErrors = false

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

    /**
     * Get next available processor index.
     *
     * @returns {number} Index between 0 and `this._concurrency`.
     */
    _nextProcIndex() {
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
     * @param {[key: string, value: ImportItem]} entry Any KVP entry from a chunk.
     * @returns {boolean} Flag denoting whether or not chunk where `entry` came from is allowed by type.
     */
    _checkChunkTypeAllowed([key, item]) {
        return !!stateManager.allowTypes[item.type]
    }

    /**
     * @param {string} chunkKey The key of the chunk currently being processed.
     * @returns {(chunkEntry) => Promise<void>} Async function affording processing of single entry in chunk.
     */
    _processItem = chunkKey => async ([encodedUrl, importItem]) => {
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
            this.processors[this._nextProcIndex()] = processor
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

            this.observer.next(msg)

            // Either flag as error or remove from state depending on processing error status
            if (msg.error && !this.processErrors) {
                await stateManager.flagItemAsError(chunkKey, encodedUrl)
            } else {
                await stateManager.removeItem(chunkKey, encodedUrl)
            }
        }
    }

    /**
     * Start execution
     */
    async start() {
        this.stopped = false

        // Iterate through data chunks from the state manager
        for await (const { chunk, chunkKey } of stateManager.getItems(
            this.processErrors,
        )) {
            const importItemEntries = Object.entries(chunk)

            // Skip early if first entry type is not allowed (entire chunk's of same type items)
            if (
                !importItemEntries.length ||
                !this._checkChunkTypeAllowed(importItemEntries[0])
            ) {
                continue
            }

            try {
                // For each chunk, run through the import item entries at specified level of concurrency
                await this.runConcurrent.map(
                    importItemEntries,
                    this._processItem(chunkKey),
                )
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
}

export default ImportProgressManager
