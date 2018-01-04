class TabTimeTracker {
    tabs = new Map()

    get size() {
        return this.tabs.size
    }

    _createNewTab = () => ({
        activeTime: 0,
        isActive: false,
        lastActivated: Date.now(),
    })

    /**
     * @param {string} id The ID of the tab to start keeping track of.
     */
    trackTab = id => this.tabs.set(id, this._createNewTab())

    /**
     * @param {string} id The ID of the tab to stop keeping track of.
     */
    removeTab = id => this.tabs.delete(id)

    /**
     * Updates the tab state to be able to calculate active times.
     *
     * @param {string} id The ID of the tab to set to active.
     */
    activateTab(id) {
        for (const [tabId, tab] of this.tabs) {
            // Only one tab can be active; if it is, reset it and count the time since activation
            if (tab.isActive) {
                this.tabs.set(tabId, {
                    ...tab,
                    isActive: false,
                    activeTime: tab.activeTime + Date.now() - tab.lastActivated,
                })
            }

            // Switch on the current tab's active state and record activation time
            if (tabId === id) {
                this.tabs.set(tabId, {
                    ...tab,
                    isActive: true,
                    lastActivated: Date.now(),
                })
            }
        }
    }
}

export default TabTimeTracker
