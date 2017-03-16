import eventToPromise from './event-to-promise'

const tabChangedEvents = tabId => [
    {
        event: browser.webNavigation.onCommitted,
        filter: details => (details.tabId == tabId && details.frameId == 0),
        reason: {message: "Tab URL changed before event occurred."}
    },
    {
        event: browser.webNavigation.onHistoryStateUpdated,
        filter: details => (details.tabId == tabId && details.frameId == 0),
        reason: {message: "Tab URL changed before event occurred."}
    },
    {
        event: browser.tabs.onRemoved,
        filter: closedTabId => (closedTabId === tabId),
        reason: {message: "Tab was closed before event occurred."},
    },
]


// Resolve if or when the page DOM is loaded (document.readyState==='interactive')
// Rejects if it is closed before that.
// XXX Needs host permission on the tab
export function whenPageDOMLoaded({tabId}) {

    return new Promise((resolve, reject) => {
        // Using executeScript at document_end here as a workaround, as there is
        // no tab.status==='interactive'; it is either 'loading' or 'complete'.
        browser.tabs.executeScript(tabId, {
            code: 'undefined',
            runAt: 'document_end',
        }).then(() => resolve())

        // Reject when the page unloads.
        eventToPromise({
            reject: tabChangedEvents(tabId),
        }).catch(reject)
    })
}

// Resolve if or when the page is completely loaded.
// Rejects if it is closed before that.
export function whenPageLoadComplete({tabId}) {
    return browser.tabs.get(tabId).then(tab => {
        if (tab.status === 'complete')
            return // Resolve directly

        return eventToPromise({
            resolve: {
                event: browser.tabs.onUpdated,
                filter: (changedTabId, {status}) =>
                    (changedTabId === tabId && status === 'complete'),
            },
            reject: tabChangedEvents(tabId)
        })
    })
}


// Resolve if or when the tab is active.
// Rejects if it is closed before that.
export function whenTabActive({tabId}) {
    return browser.tabs.query({active:true}).then(
        activeTabs => (activeTabs.map(t=>t.id).indexOf(tabId) > -1)
    ).then(isActive => {
        if (isActive)
            return // Resolve directly

        return eventToPromise({
            resolve: {
                event: browser.tabs.onActivated,
                filter: ({tabId: activatedTabId}) => (activatedTabId === tabId),
            },
            reject: tabChangedEvents(tabId)
        })
    })
}
