import delay from '../../util/delay'

// Resolve if or when the page is completely loaded.
// Rejects if it is closed before that.
function whenPageLoadComplete({tabId}) {
    return browser.tabs.get(tabId).then(tab => {
        if (tab.status === 'complete')
            return // Resolve directly
        else
            return whenPageLoadBecomesComplete({tabId})
    })
}

// Listen to tab updates, resolve when the chosen tab completes loading
function whenPageLoadBecomesComplete({tabId}) {
    return new Promise(function (resolve, reject) {
        function resolveIfComplete(changedTabId, {status}) {
            if (changedTabId === tabId && status === 'complete') {
                removeListeners()
                resolve()
            }
        }
        function rejectIfClosed(closedTabId) {
            if (closedTabId === tabId) {
                removeListeners()
                reject('Tab was closed before loading was complete.')
            }
        }
        function removeListeners() {
            browser.tabs.onUpdated.removeListener(resolveIfComplete)
            browser.tabs.onRemoved.removeListener(rejectIfClosed)
        }
        browser.tabs.onUpdated.addListener(resolveIfComplete)
        browser.tabs.onRemoved.addListener(rejectIfClosed)
    })
}


// Resolve if or when the tab is active. Rejects if tab is closed before this.
function whenTabActive({tabId}) {
    return browser.tabs.query({active:true}).then(
        activeTabs => (activeTabs.map(t=>t.id).indexOf(tabId) > -1)
    ).then(isActive => {
        if (isActive)
            return // Resolve directly
        else
            return whenTabBecomesActive({tabId})
    })
}

// Listen to tab switches, resolve when the given tab is activated.
function whenTabBecomesActive({tabId}) {
    return new Promise(function (resolve, reject) {
        function resolveIfActivated({tabId: activatedTabId}) {
            if (activatedTabId === tabId) {
                removeListeners()
                resolve()
            }
        }
        function rejectIfClosed(closedTabId) {
            if (closedTabId === tabId) {
                removeListeners()
                reject('Tab was closed before it became active')
            }
        }
        function removeListeners() {
            browser.tabs.onActivated.removeListener(resolveIfActivated)
            browser.tabs.onRemoved.removeListener(rejectIfClosed)
        }
        browser.tabs.onActivated.addListener(resolveIfActivated)
        browser.tabs.onRemoved.addListener(rejectIfClosed)
    })
}

// Take a screenshot of the tabId, if it is active.
// Returns a promise of the screenshot (a png image in a data URI).
// The promise rejects if the tab is not currently active!
function snapNow({tabId}) {
    return browser.tabs.get(tabId).then(
        tab => browser.tabs.captureVisibleTab(
            tab.windowId,
            {format: 'png'}
        )
    )
}

// Return the promise of an image (as data URI) of the visible area of the tab,
// but only as soon as it is active (due to a limitation of the browser API)
export default function makeScreenshotOfTabAsap({tabId}) {
    return whenPageLoadComplete({tabId}).then(
        () => whenTabActive({tabId})
    ).then(
        // Some delay appears required to not fail. Perhaps the browser needs
        // to complete some rendering before the screen is captured?
        () => delay(300)
    ).then(
        () => snapNow({tabId})
    )
}
