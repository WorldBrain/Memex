import delay from 'src/util/delay'
import { whenPageLoadComplete, whenTabActive } from 'src/util/tab-events'

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
