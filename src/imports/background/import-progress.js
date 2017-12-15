import promiseLimit from 'promise-limit'

import stateManager from './import-state'
import processImportItem from './import-item-processor'

class ImportProgressManager {
    static IMPORTS_PROGRESS_KEY = 'is-imports-in-progress'
    static CONCURR_LIMIT = 10

    /**
     * @property {any[]} Token objects with `cancel` method to afford cancellation of currently
     *  running Promises.
     */
    tokens = []

    /**
     * @property {number} Number between 0 and `this._concurrency` representing the latest scheduled
     *  job's index in `this.tokens`.
     */
    _tokenIndex = 0

    /**
     * @property {number} Currently set level of concurrency.
     */
    _concurrency

    /**
     * @property {any} Object containing `next` and `complete` methods to run after each item and when
     *  all items complete, respecitively.
     */
    observer

    constructor(initConcurrency, initObserver) {
        this.concurrency = initConcurrency
        this.observer = initObserver

        this.processImportItem = this.makeCancellable(processImportItem)
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
     * Allow token index state to loop back around from 0 to `this._concurrency`.
     */
    nextTokenIndex() {
        if (this._tokenIndex === this._concurrency - 1) {
            this._tokenIndex = 0
        } else {
            this._tokenIndex += 1
        }

        return this._tokenIndex
    }

    /**
     * Updates token state to add another cancellable token for a running job.
     *
     * @param {Function} cancelCb Callback to run when all jobs are cancelled.
     */
    bindNextCancellableToken(cancelCb) {
        this.tokens[this.nextTokenIndex()] = { cancel: cancelCb }
    }

    /**
     * Start execution
     */
    async start() {
        let cancelled = false

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
                    cancelled = true
                    break
                }
                console.error(err)
            }
        }

        if (!cancelled) {
            // Notify observer that we're done!
            this.observer.complete()
        }
    }

    /**
     * Goes through each Promise token and runs the `cancel()` callback, passing in Error
     * with `cancel` bool property. Token state is cleared afterwards.
     */
    stop() {
        // Create error with `cancelled` bool property to distinguish in callers
        const err = new Error('Stopping progress')
        err.cancelled = true

        let token
        while (this.tokens.length) {
            token = this.tokens.pop()
            if (token != null && typeof token.cancel === 'function') {
                // Run token's cancal callback to stop running async logic
                token.cancel(err)
            }
        }
    }

    /**
     * @param {(a: any) => Promise<any>} asyncFn Async function to make cancellable
     * @returns {(a: any) => Promise<any>} asyncFn Same function which will be interrupted upon `stop()` method call.
     */
    makeCancellable = asyncFn => (...args) =>
        new Promise((resolve, reject) => {
            // Bind the reject callback to token to allow outside cancellation of `this` Promise
            this.bindNextCancellableToken(reject)

            // Run orig async function
            asyncFn(...args)
                .then(resolve)
                .catch(reject)
        })

    /**
     * @param {string} chunkKey The key of the chunk currently being processed.
     * @returns {(chunkEntry) => Promise<void>} Async function affording processing of single entry in chunk.
     */
    processItem = chunkKey => async ([encodedUrl, importItem]) => {
        // Used to flag if `this` async logic gets cancelled (don't send message)
        let cancelled = false

        // Used to build the message to send to observer
        const msg = {
            type: importItem.type,
            url: importItem.url,
        }

        try {
            const res = await this.processImportItem(importItem)
            msg.status = res.status
        } catch (err) {
            // Throw execution was cancelled, throw error up the stack
            if (err.cancelled) {
                cancelled = true
                throw err
            } else {
                msg.error = err.message
            }
        } finally {
            // Send item data + outcome status down to UI (and error if present)
            if (!cancelled) {
                this.observer.next(msg)
                await stateManager.removeItem(chunkKey, encodedUrl)
            }
        }
    }
}

export default ImportProgressManager
