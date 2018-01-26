import PausableTimer from 'src/util/pausable-timer'
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

        this._timer = null
        this._logDelay = logDelay
    }

    scheduleLog(logCb) {
        this.cancelPendingOps()
        this._timer = new PausableTimer({
            delay: this._logDelay,
            cb: logCb,
            // Start timer if currently active
            start: this.isActive,
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
        if (this._timer != null) {
            this._timer.clear()
            this._timer = null
        }
    }
}

export default Tab
