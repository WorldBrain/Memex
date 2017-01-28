import eventToPromise from './event-to-promise'

// Resolve if or when the page DOM is loaded (document.readyState==='interactive')
// Rejects if it is closed before that.
// XXX Needs host permission on the tab
export function whenPageDOMLoaded({tabId}) {
    // This more obvious approach can get stuck in limbo, as there is no
    // tab.status==='interactive'; it is either 'loading' or 'complete'.
    // return browser.tabs.get(tabId).then(tab => {
    //     if (tab.status === 'complete') // XXX Tests the wrong thing.
    //         return // Resolve directly
    //
    //     return eventToPromise({
    //         resolve: {
    //             event: browser.webNavigation.onDOMContentLoaded,
    //             filter: ({tabId: eventTabId}) => (eventTabId===tabId),
    //         },
    //         reject: {
    //             event: browser.tabs.onRemoved,
    //             filter: (closedTabId) => (closedTabId === tabId),
    //             reason: {message: "Tab was closed before DOM was loaded."},
    //         },
    //     })
    // })

    // Workaround: we run a script at 'document_end' (= 'interactive')
    return browser.tabs.executeScript(tabId, {
        code: 'undefined', // Bogus code, anything works.
        runAt: 'document_end',
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
            reject: {
                event: browser.tabs.onRemoved,
                filter: (closedTabId) => (closedTabId === tabId),
                reason: {message: "Tab was closed before loading was complete."},
            },
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
            reject: {
                event: browser.tabs.onRemoved,
                filter: (closedTabId) => (closedTabId === tabId),
                reason: {message: "Tab was closed before it became active."},
            },
        })
    })
}
