import debounce from 'lodash/debounce'

import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import { maybeLogPageVisit } from './log-page-visit'
import initPauser from './pause-logging'
import TabTimeTracker from './tab-time-tracker'
import { isLoggable, getPauseState } from '..'

// Allow logging pause state toggle to be called from other scripts
const toggleLoggingPause = initPauser()
makeRemotelyCallable({ toggleLoggingPause })

// Debounced functions fro each tab are stored here
const tabs = {}

// Set up tab time tracker state to work with tab events
const tracker = new TabTimeTracker()
browser.tabs.onCreated.addListener(tab => tracker.trackTab(tab.id))
browser.tabs.onRemoved.addListener(tabId => tracker.removeTab(tabId))
browser.tabs.onActivated.addListener(({ tabId }) => tracker.activateTab(tabId))

// Listens for url changes of the page
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.url && tab.url && isLoggable(tab)) {
        // Check if we already have a debounced function for this tab and cancel it
        if (tabs[tabId]) {
            tabs[tabId].cancel()
        }

        // Create debounced function and call it
        tabs[tabId] = debounce(async () => {
            // Bail-out if logging paused or imports in progress
            if (await getPauseState()) {
                return
            }

            return maybeLogPageVisit({ url: tab.url, tabId: tabId })
        }, 10000)
        tabs[tabId]()
    }
})
