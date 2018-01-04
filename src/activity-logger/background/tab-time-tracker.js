/**
 * @typedef TabActiveState
 * @type Object
 * @property {number} activeTime Non-neg int representing accumulated active time in ms.
 * @property {boolean} isActive Flag that denotes activity.
 * @property {number} lastActivated Epoch timestamp representing last time being activated.
 */

class TabTimeTracker {
    /**
     * @property {Map<string, TabActiveState>}
     */
    _tabs = new Map()

    get size() {
        return this._tabs.size
    }

    /**
     * @returns {TabActiveState}
     */
    _createNewTab = () => ({
        activeTime: 0,
        isActive: false,
        lastActivated: Date.now(),
    })

    /**
     * @param {string} id The ID of the tab to start keeping track of.
     */
    trackTab = id => this._tabs.set(id, this._createNewTab())

    /**
     * @param {string} id The ID of the tab to stop keeping track of.
     * @returns {TabActiveState|undefined}
     */
    removeTab(id) {
        const toRemove = this._tabs.get(id)
        this._tabs.delete(id)

        // Update `activeTime` with final difference, only if still active when closed
        if (toRemove.isActive) {
            return {
                ...toRemove,
                activeTime:
                    toRemove.activeTime + Date.now() - toRemove.lastActivated,
            }
        }

        return toRemove
    }

    /**
     * Updates the tab state to be able to calculate active times.
     *
     * @param {string} id The ID of the tab to set to active.
     */
    activateTab(id) {
        for (const [tabId, tab] of this._tabs) {
            // Only one tab can be active; if it is, reset it and count the time since activation
            if (tab.isActive) {
                this._tabs.set(tabId, {
                    ...tab,
                    isActive: false,
                    activeTime: tab.activeTime + Date.now() - tab.lastActivated,
                })
            }

            // Switch on the current tab's active state and record activation time
            if (tabId === id) {
                this._tabs.set(tabId, {
                    ...tab,
                    isActive: true,
                    lastActivated: Date.now(),
                })
            }
        }
    }
}

export default TabTimeTracker
