import maybeLogPageVisit from './log-page-visit'

// Listens for url changes of the page
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url && tab.url) {
        maybeLogPageVisit({url: tab.url, tabId: tabId})
    }
})
