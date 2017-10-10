import Rx from 'rxjs'
import noop from 'lodash/fp/noop'

/**
 * Given specified async means of fetching input/state along with processing, will construct a batcher. Batcher
 * affords concurrent batching of processes on each of the input items. Custom logic can be specified to handle
 * different processing events, via the `observer`. Given state management specified in the `observer`, the
 * interface can be used to afford "pausing" of a batch (any ongoing processing will be lost).
 */
export default class PromiseBatcher {
    /**
     * @param {() => Promise<Array<any>>} inputBatchCallback The async callback to run to fetch input. Note that this
     *  will be re-run every time `start` is called (both on resume and init start), hence this input will effectively
     *  act as state for the batcher. State management should be handled in the `observer` callbacks.
     * @param {(input: any) => Promise<any>} processingCallback The callback to run each input on.
     * @param {number} [concurrency=5] How many input itemss to be processing at any time.
     * @param {any} observer Affords logic to run on certain events relating to the processing of each input item:
     *  - successful finish: `next`
     *  - erroring out: `error`
     *  - completion/exhaustion of all inputs: `complete`
     *  All set to no-ops, if nothing specified.
     */
    constructor({
        inputBatchCallback,
        processingCallback,
        concurrency = 5,
        observer: { next = noop, error = noop, complete = noop } = {},
    }) {
        this.getInputBatch = inputBatchCallback
        this.process = processingCallback
        this.concurrency = concurrency
        this.observer = { next, error, complete }

        // State to keep track of subscription (allow hiding of Rx away from caller)
        this.sub = undefined

        this.getDeferredInputObservable = this._getDeferredInputObservable.bind(
            this,
        )
    }

    /**
     * Allows shaping of the output to the observer's `next` or `error` logic. Here we are
     * allowing the input to be passed to the output as well, as else the batcher user does not
     * know the current state of the batcher through the input collection.
     *
     * @param input The original input given to a specific deferred processing function invocation.
     * @param output The output of the same processing function's invocation.
     */
    _getOutputShape(input, output) {
        return { input, output }
    }

    /**
     * Given an input, defers the async processing callback and handles any errors.
     * @param {any} input The input to defer processing on.
     * @return {Rx.Observable}
     */
    _getDeferredInputObservable(input) {
        return Rx.Observable.defer(() => this.process(input)).catch(err => {
            // Note we're explicitly using the observer's onError callback here so RxJS stream does not stop
            this.observer.error({ input, error: err.message })
            // Return empty observable to ignore error and continue stream
            return Rx.Observable.empty()
        })
    }

    /**
     * Subscribes to Observable built on the batch input.
     */
    _subscribeToBatchObservable() {
        const inputBatchPromise = this.getInputBatch()

        this.sub = Rx.Observable
            .from(inputBatchPromise)
            .mergeMap(Rx.Observable.from)
            .mergeMap(
                this.getDeferredInputObservable, // Defer async callbacks on input...
                this._getOutputShape,
                this.concurrency,
            ) // ...but run this many at any time
            .subscribe(
                this.observer.next,
                noop, // Set error to noop as RxJS stops the stream on errors; we don't want to
                this.observer.complete,
            )
    }

    /**
     * Starts/resumes the batched processing on the input.
     * @returns {boolean} Denotes whether or not batch could be started/resumed.
     */
    start() {
        if (this.sub) {
            return false
        }

        this._subscribeToBatchObservable()
        return true
    }

    /**
     * Terminates a running batch.
     * @returns {boolean} Denotes whether or not batch could be terminated.
     */
    stop() {
        if (!this.sub) {
            return false
        }

        // Unsub to end observable processing and explicitly remove pointer to old sub
        this.sub.unsubscribe()
        this.sub = undefined
        return true
    }
}
