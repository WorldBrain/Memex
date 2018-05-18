import { Tabs } from 'webextension-polyfill-ts'

import Tab from './tab-state'

export class TabManager {
    private _tabs = new Map<number, Tab>()

    /**
     * @param tab The browser tab to start keeping track of.
     */
    trackTab = ({ id, active, url }: Tabs.Tab) =>
        this._tabs.set(id, new Tab({ isActive: active, url }))

    /**
     * @param id The ID of the tab as assigned by web ext API.
     * @returns The state for tab stored under given ID, or undefined if no matching tab.
     */
    getTabState(id: number) {
        return this._tabs.get(id)
    }

    /**
     * @param id The ID of the tab to stop keeping track of.
     */
    removeTab(id: number) {
        const toRemove = this.getTabState(id)

        if (toRemove != null) {
            this._tabs.delete(id)

            toRemove.toggleActiveState()
        }

        return toRemove
    }

    /**
     * Resets the state of a given tab, persisting active state.
     *
     * @returns The state of the previously tracked tab assoc. with `id`.
     */
    resetTab(id: number, activeState: boolean, url: string) {
        const oldTab = this.removeTab(id)

        if (oldTab != null) {
            this._tabs.set(
                id,
                new Tab({
                    isActive: activeState,
                    navState: oldTab.navState,
                    url,
                }),
            )
        }

        return oldTab
    }

    /**
     * Updates the tab state to be able to calculate active times.
     *
     * @param id The ID of the tab to set to active.
     */
    activateTab(id: number) {
        for (const [tabId, tab] of this._tabs) {
            // Toggle active state on currently active and the new candidate tab
            if (tab.isActive || tabId === id) {
                tab.toggleActiveState()
            }
        }
    }

    /**
     * @param id The ID of the tab to set to update scroll state for.
     * @param newState The new scroll state to set.
     */
    updateTabScrollState(id: number, newState) {
        const tab = this.getTabState(id)

        if (tab != null) {
            tab.scrollState.updateState(newState)
        }
    }

    /**
     * @param id The ID of the tab to set to update scroll state for.
     * @param navState Object containing `webNavigation.TransitionQualifier`s under `qualifiers` prop
     *  and ` webNavigation.TransitionType` under `type` prop.
     */
    updateNavState(id: number, navState) {
        const tab = this.getTabState(id)

        if (tab != null) {
            tab.navState = navState
        }
    }
}

// Set up singleton to use throughout bg script
const manager = new TabManager()

window['tabMan'] = manager

export default manager
