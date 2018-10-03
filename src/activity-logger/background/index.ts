import { browser } from 'webextension-polyfill-ts'

import { makeRemotelyCallable } from '../../util/webextensionRPC'
import initPauser from './pause-logging'
import { updateVisitInteractionData } from './util'
import tabManager from './tab-manager'
import { tabUpdatedListener } from './tab-bridge'

// Allow logging pause state toggle to be called from other scripts
const toggleLoggingPause = initPauser()
makeRemotelyCallable({
    toggleLoggingPause,
    fetchTab: id => tabManager.getTabState(id),
})

// Ensure tab scroll states are kept in-sync with scroll events from the content script
browser.runtime.onMessage.addListener(
    ({ funcName, ...scrollState }, { tab }) => {
        if (funcName !== 'updateScrollState' || tab == null) {
            return
        }
        tabManager.updateTabScrollState(tab.id, scrollState)
    },
)

// Bind tab state updates to tab API events
browser.tabs.onCreated.addListener(tabManager.trackTab)

browser.tabs.onActivated.addListener(({ tabId }) =>
    tabManager.activateTab(tabId),
)

// Runs stage 3 of the visit indexing
browser.tabs.onRemoved.addListener(tabId => {
    // Remove tab from tab tracking state and update the visit with tab-derived metadata
    const tab = tabManager.removeTab(tabId)

    if (tab != null) {
        updateVisitInteractionData(tab)
    }
})

/**
 * The `webNavigation.onCommitted` event gives us some useful data related to how the navigation event
 * occured (client/server redirect, user typed in address bar, link click, etc.). Might as well keep the last
 * navigation event for each tab in state for later decision making.
 */
browser.webNavigation.onCommitted.addListener(
    ({ tabId, frameId, ...navData }: any) => {
        // Frame ID is always `0` for the main webpage frame, which is what we care about
        if (frameId === 0) {
            tabManager.updateNavState(tabId, {
                type: navData.transitionType,
                qualifiers: navData.transitionQualifiers,
            })
        }
    },
)

browser.tabs.onUpdated.addListener(tabUpdatedListener)

export { tabManager }
