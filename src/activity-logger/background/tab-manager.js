import Tab from './tab-state'

export class TabManager {
    /**
     * @property {Map<number, Tab>}
     */
    _tabs = new Map()

    get size() {
        return this._tabs.size
    }

    /**
     * @param {tabs.Tab} tab The browser tab to start keeping track of.
     */
    trackTab = ({ id, active }) =>
        this._tabs.set(id, new Tab({ isActive: active }))

    /**
     * @param {number} id The ID of the tab as assigned by web ext API.
     * @returns {Tab} The state for tab stored under given ID.
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
     * @param {number} id The ID of the tab to stop keeping track of.
     * @returns {Tab}
     */
    removeTab(id) {
        const toRemove = this.getTabState(id)
        toRemove.cancelPendingOps()
        this._tabs.delete(id)

        // If still active when closed, toggle active state to force time recalc
        toRemove.toggleActiveState()
        return toRemove
    }

    /**
     * Resets the state of a given tab, persisting active state.
     *
     * @param {number} id The ID of the tab to stop reset tracking of.
     * @returns {Tab} The state of the previously tracked tab assoc. with `id`.
     */
    resetTab(id, activeState) {
        const oldTab = this.removeTab(id)
        this._tabs.set(
            id,
            new Tab({
                isActive: activeState,
                navState: oldTab.navState,
            }),
        )
        return oldTab
    }

    /**
     * Updates the tab state to be able to calculate active times.
     *
     * @param {number} id The ID of the tab to set to active.
     */
    activateTab(id) {
        for (const [tabId, tab] of this._tabs) {
            // Toggle active state on currently active and the new candidate tab
            if (tab.isActive || tabId === id) {
                tab.toggleActiveState()
            }
        }
    }

    /**
     * @param {number} id The ID of the tab to set to associate the debounced log with.
     * @param {() => Promise<void>} cb The page log logic to delay.
     */
    scheduleTabLog(id, logCb) {
        const tab = this.getTabState(id)
        tab.scheduledLog = logCb
    }

    clearScheduledLog(id) {
        const tab = this.getTabState(id)
        tab.cancelPendingOps()
    }

    /**
     * @param {number} id The ID of the tab to set to update scroll state for.
     * @param {any} newState The new scroll state to set.
     */
    updateTabScrollState(id, newState) {
        try {
            const tab = this.getTabState(id)
            tab.scrollState.updateState(newState)
        } catch (err) {}
    }

    /**
     * @param {number} id The ID of the tab to set to update navigation state for.
     * @param {any} navState Object containing `webNavigation.TransitionQualifier`s under `qualifiers` prop
     *  and ` webNavigation.TransitionType` under `type` prop.
     */
    updateNavState(id, navState) {
        try {
            const tab = this.getTabState(id)
            tab.navState = navState
        } catch (err) {}
    }
}

// Set up singleton to use throughout bg script
const manager = new TabManager()

export default manager
