import ScrollState from './scroll-state'

/**
 * @class Tab
 * @property {number} activeTime Non-neg int representing accumulated active time in ms.
 * @property {boolean} isActive Flag that denotes activity.
 * @property {number} lastActivated Epoch timestamp representing last time being activated.
 * @property {string} visitTime Epoch timestamp representing the time of the visit event associated with this tab.
 * @property {ScrollState} scrollState Each tab will have their scroll state tracked.
 * @property {number} [timeout] A timeout ID returned from a `setTimeout` call.
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
        this._timeout = null
        this._logDelay = logDelay
    }

    set scheduledLog(logCb) {
        this.cancelPendingOps()
        this._timeout = setTimeout(logCb, this._logDelay)
    }

    toggleActiveState(now = Date.now()) {
        if (this.isActive) {
            this.activeTime = this.activeTime + now - this.lastActivated
        } else {
            this.lastActivated = now
        }

        this.isActive = !this.isActive
    }

    cancelPendingOps() {
        if (this._timeout != null) {
            clearTimeout(this._timeout)
            this._timeout = null
        }
    }
}

export default Tab
