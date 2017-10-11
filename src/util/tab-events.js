import eventToPromise from './event-to-promise'

const tabChangedEvents = tabId => [
    {
        event: browser.webNavigation.onCommitted,
        filter: details => details.tabId === tabId && details.frameId === 0,
        reason: { message: 'Tab URL changed before event occurred.' },
    },
    // TODO Handle history state updates more carefully. Ignoring these events for now.
    // {
    //     event: browser.webNavigation.onHistoryStateUpdated,
    //     filter: details => (details.tabId === tabId && details.frameId === 0),
    //     reason: {message: 'Tab URL changed before event occurred.'},
    // },
    {
        event: browser.tabs.onRemoved,
        filter: closedTabId => closedTabId === tabId,
        reason: { message: 'Tab was closed before event occurred.' },
    },
]

// Resolve if or when the page DOM is loaded (document.readyState==='interactive')
// Rejects if it is closed before that.
// XXX Needs host permission on the tab
export function whenPageDOMLoaded({ tabId }) {
    return new Promise((resolve, reject) => {
        // Using executeScript at document_end here as a workaround, as there is
        // no tab.status==='interactive'; it is either 'loading' or 'complete'.
        browser.tabs
            .executeScript(tabId, {
                code: 'undefined',
                runAt: 'document_end',
            })
            .then(() => resolve())
            .catch(reject)

        // Reject when the page unloads.
        eventToPromise({
            reject: tabChangedEvents(tabId),
        }).catch(reject)
    })
}

// Resolve if or when the page is completely loaded.
// Rejects if it is closed before that.
export async function whenPageLoadComplete({ tabId }) {
    const tab = await browser.tabs.get(tabId)

    if (tab.status === 'complete') {
        return
    } // Resolve directly

    return eventToPromise({
        resolve: {
            event: browser.tabs.onUpdated,
            filter: (changedTabId, { status }) =>
                changedTabId === tabId && status === 'complete',
        },
        reject: tabChangedEvents(tabId),
    })
}

// Resolve if or when the tab is active.
// Rejects if it is closed before that.
export async function whenTabActive({ tabId }) {
    const activeTabs = await browser.tabs.query({ active: true })
    const isActive = activeTabs.map(t => t.id).indexOf(tabId) > -1

    if (isActive) {
        return
    } // Resolve directly

    return eventToPromise({
        resolve: {
            event: browser.tabs.onActivated,
            filter: ({ tabId: activatedTabId }) => activatedTabId === tabId,
        },
        reject: tabChangedEvents(tabId),
    })
}
