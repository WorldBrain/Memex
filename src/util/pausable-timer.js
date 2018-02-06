class PausableTimer {
    _timeoutId

    /**
     * @param {Object} args
     * @param {() => any} args.cb The callback to delay.
     * @param {number} args.delay Time in ms to delay for.
     * @param {boolean} [args.start=true] Whether or not to start the timeout immediately or on later `.resume()` call.
     */
    constructor({ cb, delay, start = true }) {
        this.cb = cb
        this._remain = delay

        if (start) {
            this.resume()
        }
    }

    set delay(val) {
        this._remain = val
    }

    /**
     * Resumes a paused timer, storing the resumed time and new timer ID as state.
     */
    resume() {
        if (this._remain <= 0) {
            return
        }

        this._start = Date.now()
        clearTimeout(this._timeoutId)
        this._timeoutId = setTimeout(this.cb, this._remain)
    }

    /**
     * Pauses the timer and stores the remaining state for next `.resume()` invocation.
     */
    pause() {
        if (this._remain <= 0 || this._start == null) {
            return
        }

        clearTimeout(this._timeoutId)
        this._remain -= Date.now() - this._start
    }

    /**
     * Clears any ongoing timer and removes it from state.
     */
    clear() {
        clearTimeout(this._timeoutId)
        this._timeoutId = null
    }
}

export default PausableTimer
