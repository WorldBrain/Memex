import { Tabs } from 'webextension-polyfill-ts'
import Tab, { TabProps } from './tab-state'
import { TabState, NavState } from './types'

export class TabManager {
    static DELAY_UNIT = 1000
    static DEF_LOG_DELAY = 2

    private _tabs = new Map<number, Tab>()

    get size() {
        return this._tabs.size
    }

    /**
     * @param {tabs.Tab} tab The browser tab to start keeping track of.
     */
    trackTab = (
        { id, active, url }: Tabs.Tab,
        extraProps: Partial<TabProps> = {},
    ) =>
        this._tabs.set(
            id,
            new Tab({ id, isActive: active, url, ...extraProps }),
        )

    /**
     * @param {number} id The ID of the tab as assigned by web ext API.
     * @returns {Tab|undefined} The state for tab stored under given ID, or undefined if no matching tab.
     */
    getTabState(id: number) {
        return this._tabs.get(id)
    }

    getActiveTab() {
        let activeTab: TabState = null

        for (const [id, tab] of this._tabs) {
            if (tab.isActive) {
                activeTab = { ...tab, id }
                break
            }
        }

        return activeTab
    }

    isTracked(id: number) {
        return this._tabs.has(id)
    }

    /**
     * @param {number} id The ID of the tab to stop keeping track of.
     * @returns {Tab}
     */
    removeTab(id: number) {
        const toRemove = this.getTabState(id)

        if (toRemove != null) {
            toRemove.cancelPendingOps()
            this._tabs.delete(id)

            // If still active when closed, toggle active state to force time recalc
            toRemove.toggleActiveState(true)
        }

        return toRemove
    }

    /**
     * Resets the state of a given tab, persisting active state.
     *
     * @param {number} id The ID of the tab to stop reset tracking of.
     * @returns {Tab} The state of the previously tracked tab assoc. with `id`.
     */
    resetTab(
        id: number,
        { isActive, url, isBookmarked, isLoaded }: Partial<TabState>,
    ) {
        const oldTab = this.removeTab(id)

        if (oldTab != null) {
            this._tabs.set(
                id,
                new Tab({
                    id,
                    url,
                    isLoaded,
                    isBookmarked,
                    isActive,
                    navState: oldTab.navState,
                }),
            )
        }

        return oldTab
    }

    /**
     * Updates the tab state to be able to calculate active times.
     *
     * @param {number} id The ID of the tab to set to active.
     */
    activateTab(id: number) {
        for (const [tabId, tab] of this._tabs) {
            // Toggle active state on currently active and the new candidate tab
            if (tab.isActive || tabId === id) {
                tab.toggleActiveState()
            }
        }
    }

    setTabLoaded(id: number, isLoaded: boolean) {
        const tab = this.getTabState(id)

        if (tab != null) {
            tab.setLoadedState(isLoaded)
        }
    }

    /**
     * @param {number} id The ID of the tab to set to associate the debounced log with.
     * @param {() => Promise<void>} cb The page log logic to delay.
     * @param {number} [delay] The number of seconds to delay for.
     */
    async scheduleTabLog(
        id: number,
        logCb: () => void | Promise<void>,
        delay = TabManager.DEF_LOG_DELAY,
    ) {
        const tab = this.getTabState(id)

        if (tab != null) {
            return tab.scheduleLog(logCb, delay * TabManager.DELAY_UNIT)
        }
    }

    clearScheduledLog(id: number) {
        const tab = this.getTabState(id)

        if (tab != null) {
            tab.cancelPendingOps()
        }
    }

    /**
     * @param {number} id The ID of the tab to set to update scroll state for.
     * @param {any} newState The new scroll state to set.
     */
    updateTabScrollState(id: number, newState) {
        const tab = this.getTabState(id)

        if (tab != null) {
            tab.scrollState.updateState(newState)
        }
    }

    /**
     * @param id The ID of the tab to set to update navigation state for.
     * @param navState Object containing `webNavigation.TransitionQualifier`s under `qualifiers` prop
     *  and ` webNavigation.TransitionType` under `type` prop.
     */
    updateNavState(id: number, navState: NavState) {
        const tab = this.getTabState(id)

        if (tab != null) {
            tab.navState = navState
        }
    }

    setBookmarkState(url: string, newState: boolean) {
        for (const [, tab] of this._tabs) {
            if (tab.url === url) {
                tab.isBookmarked = newState
            }
        }
    }
}

// Set up singleton to use throughout bg script
const manager = new TabManager()

window['man'] = manager

export default manager
