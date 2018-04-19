import PausableTimer from 'src/util/pausable-timer'
import ScrollState from './scroll-state'

class Tab {
    static DEF_LOG_DELAY = 4000

    /**
     * @param {any} args
     * @param {number} [logDelay] The # of ms a user must be active on this tab before calling scheduled log.
     */
    constructor(
        { url, isActive = false, visitTime = `${Date.now()}`, navState = {} },
        logDelay = Tab.DEF_LOG_DELAY,
    ) {
        this.url = url
        this.isActive = isActive
        this.visitTime = visitTime
        this.navState = navState
        this.scrollState = new ScrollState()
        this.activeTime = 0
        this.lastActivated = Date.now()

        this._timer = null
        this._logDelay = logDelay
    }

    /**
     * Sets up a PausableTimer to run the given log function. This can be stopped, started, or cancelled.
     *
     * @param {() => any} logCb Logic to schedule to run on this tab later.
     */
    scheduleLog(logCb) {
        this.cancelPendingOps()
        this._timer = new PausableTimer({
            delay: this._logDelay,
            cb: logCb,
            start: this.isActive, // Start timer if currently active
        })
    }

    _pauseLogTimer() {
        if (this._timer != null) {
            this._timer.pause()
        }
    }

    _resumeLogTimer() {
        if (this._timer != null) {
            this._timer.resume()
        }
    }

    /**
     * Updates the active and possibly ongoing timer states either to
     * mark being made active or inactive by the user.
     *
     * @param {number} [now=Date.now()] When the active state changed.
     */
    toggleActiveState(now = Date.now()) {
        if (this.isActive) {
            this.activeTime = this.activeTime + now - this.lastActivated
            this._pauseLogTimer()
        } else {
            this.lastActivated = now
            this._resumeLogTimer()
        }

        this.isActive = !this.isActive
    }

    /**
     * Cancels any scheduled log created from `scheduleLog` calls.
     */
    cancelPendingOps() {
        if (this._timer != null) {
            this._timer.clear()
            this._timer = null
        }
    }
}

export default Tab
