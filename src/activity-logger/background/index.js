import maybeLogPageVisit from './log-page-visit'
import debounce from 'lodash/debounce'

// Debounced functions fro each tab are stored here
const tabs = {}

// Listens for url changes of the page
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url && tab.url) {
        // Check if we already have a debounced function for this tab and cancel it
        if (tabs[tabId]) tabs[tabId].cancel()

        // Create debounced function and call it
        tabs[tabId] = debounce(() => maybeLogPageVisit({url: tab.url, tabId: tabId}), 10000)
        tabs[tabId]()
    }
})
