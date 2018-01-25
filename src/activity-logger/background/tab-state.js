import ScrollState from './scroll-state'

/**
 * @class Tab
 * @property {number} activeTime Non-neg int representing accumulated active time in ms.
 * @property {boolean} isActive Flag that denotes activity.
 * @property {number} lastActivated Epoch timestamp representing last time being activated.
 * @property {string} visitTime Epoch timestamp representing the time of the visit event associated with this tab.
 * @property {ScrollState} scrollState Each tab will have their scroll state tracked.
 */
class Tab {
    static DEF_LOG_DELAY = 10000

    constructor(
        { isActive = false, visitTime = `${Date.now()}`, navState = {} },
        logDelay = Tab.DEF_LOG_DELAY,
    ) {
        this.isActive = isActive
        this.visitTime = visitTime
        this.navState = navState
        this.scrollState = new ScrollState()
        this.activeTime = 0
        this.lastActivated = Date.now()

        this._logCb = null
        this._timeout = null
        this._timeoutRemain = logDelay
    }

    scheduleLog(logCb) {
        this.cancelPendingOps()
        this._logCb = logCb

        // Start timer if currently active
        if (this.isActive) {
            this._resumeLogTimer()
        }
    }

    _pauseLogTimer() {
        // If there is a pending timeout
        if (this._timeout != null) {
            clearTimeout(this._timeout)
            this._timeout = null
            this._timeoutRemain -= Date.now() - this.lastActivated
        }
    }

    _resumeLogTimer() {
        // If log still has not occurred
        if (this._logCb != null && this._timeoutRemain > 0) {
            this._timeout = setTimeout(this._logCb, this._timeoutRemain)
        }
    }

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

    cancelPendingOps() {
        clearTimeout(this._timeout)
        this._timeout = null
        this._logCb = null
    }
}

export default Tab
