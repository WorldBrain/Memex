import delay from 'src/util/delay'
import { whenTabActive } from 'src/util/tab-events'

// Take a screenshot of the tabId, if it is active.
// Returns a promise of the screenshot (a png image in a data URL).
// The promise rejects if the tab is not currently active!
async function snapNow({tabId}) {
    const tab = await browser.tabs.get(tabId)
    const image = await browser.tabs.captureVisibleTab(
        tab.windowId,
        {format: 'png'}
    )
    return image
}

// Return the promise of an image (as data URL) of the visible area of the tab,
// but only as soon as it is active (due to a limitation of the browser API)
export default async function makeScreenshotOfTabAsap({tabId}) {
    await whenTabActive({tabId})
    // Some delay appears required to not fail. Perhaps the browser needs
    // to complete some rendering before the screen is captured?
    await delay(300)
    const image = await snapNow({tabId})
    return image
}
