import ScrollState from './scroll-state'

/**
 * @typedef TabActiveState
 * @type Object
 * @property {number} activeTime Non-neg int representing accumulated active time in ms.
 * @property {boolean} isActive Flag that denotes activity.
 * @property {number} lastActivated Epoch timestamp representing last time being activated.
 * @property {string} visitTime Epoch timestamp representing the time of the visit event associated with this tab.
 * @property {ScrollState} scrollState Each tab will have their scroll state tracked.
 * @property {number} [timeout] A timeout ID returned from a `setTimeout` call.
 */

export class TabManager {
    static DEF_LOG_DELAY = 10000

    /**
     * @property {Map<string, TabActiveState>}
     */
    _tabs = new Map()
    _logDelay

    constructor(logDelay = TabManager.DEF_LOG_DELAY) {
        this._logDelay = logDelay
    }

    get size() {
        return this._tabs.size
    }

    /**
     * @returns {TabActiveState}
     */
    _createNewTab = ({ isActive = false, visitTime = `${Date.now()}` }) => ({
        activeTime: 0,
        lastActivated: Date.now(),
        isActive,
        visitTime,
        scrollState: new ScrollState(),
        timeout: null,
    })

    /**
     * Reduces a tab's state to toggle between active and inactive. Time updates are performed based on active state change.
     */
    _toggleActiveState = ({ isActive, activeTime, lastActivated, ...tab }) => ({
        ...tab,
        isActive: !isActive,
        activeTime: isActive
            ? activeTime + Date.now() - lastActivated
            : activeTime,
        lastActivated: isActive ? lastActivated : Date.now(),
    })

    /**
     * @param {tabs.Tab} tab The browser tab to start keeping track of.
     */
    trackTab = ({ id, active }) =>
        this._tabs.set(id, this._createNewTab({ isActive: active }))

    /**
     * @param {string} id The ID of the tab as assigned by web ext API.
     * @returns {TabActiveState} The state for tab stored under given ID.
     * @throws {Error} If input `id` does not correspond to any tab stored in state.
     */
    getTabState(id) {
        const tab = this._tabs.get(id)
        if (tab == null) {
            throw new Error(`No tab stored under ID: ${id}`)
        }

        return tab
    }

    /**
     * @param {string} id The ID of the tab to stop keeping track of.
     * @returns {TabActiveState}
     */
    removeTab(id) {
        const toRemove = this.getTabState(id)

        // Cancel any pending operations
        if (toRemove.timeout != null) {
            clearTimeout(toRemove.timeout)
        }

        this._tabs.delete(id)

        // If still active when closed, toggle active state to force time recalc
        return this._toggleActiveState(toRemove)
    }

    /**
     * Resets the state of a given tab, persisting active state.
     *
     * @param {string} id The ID of the tab to stop reset tracking of.
     * @returns {TabActiveState} The state of the previously tracked tab assoc. with `id`.
     */
    resetTab(id, activeState) {
        const oldTab = this.removeTab(id)
        this.trackTab({ id, active: activeState })
        return oldTab
    }

    /**
     * Updates the tab state to be able to calculate active times.
     *
     * @param {string} id The ID of the tab to set to active.
     */
    activateTab(id) {
        for (const [tabId, tab] of this._tabs) {
            // Toggle active state on currently active and the new candidate tab
            if (tab.isActive || tabId === id) {
                this._tabs.set(tabId, this._toggleActiveState(tab))
            }
        }
    }

    /**
     * @param {string} id The ID of the tab to set to associate the debounced log with.
     * @param {() => void} cb The page log logic to delay.
     */
    scheduleTabLog(id, cb) {
        const tab = this.getTabState(id)

        // Check if we already have a delayed  function for this tab and cancel it
        if (tab.timeout != null) {
            clearTimeout(tab.timeout)
        }

        // Set up new delayed  page log, updating state
        this._tabs.set(id, {
            ...tab,
            timeout: setTimeout(cb, this._logDelay),
        })
    }

    clearScheduledLog(id) {
        const tab = this.getTabState(id)

        if (tab.timeout != null) {
            clearTimeout(tab.timeout)
        }

        this._tabs.set(id, { ...tab, timeout: null })
    }

    /**
     * @param {string} id The ID of the tab to set to associate the debounced log with.
     * @param {any} newState The new scroll state to set.
     */
    updateTabScrollState(id, newState) {
        const tab = this.getTabState(id)
        tab.scrollState.updateState(newState)
    }
}

// Set up singleton to use throughout bg script
const manager = new TabManager()

export default manager
