import delay from 'src/util/delay'
import { whenPageLoadComplete, whenTabActive } from 'src/util/tab-events'

// Take a screenshot of the tabId, if it is active.
// Returns a promise of the screenshot (a png image in a data URL).
// The promise rejects if the tab is not currently active!
async function snapNow({ tabId }) {
    const tab = await browser.tabs.get(tabId)
    let image = await browser.tabs.captureVisibleTab(tab.windowId, {
        format: 'png',
    })
    image = await resizeImage(image, 400, 400)
    return image
}

async function resizeImage(image, maxWidth, maxHeight) {
    return new Promise((resolve, reject) => {
        let img = new Image()
        img.onload = () => {
            let canvas = document.createElement('canvas')
            let ctx = canvas.getContext('2d')
            let ratio = Math.min(maxWidth / img.width, maxHeight / img.height)
            canvas.width = img.width * ratio
            canvas.height = img.height * ratio

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

            resolve(canvas.toDataURL())
        }
        img.onerror = reject
        img.src = image
    })
}

// Return the promise of an image (as data URL) of the visible area of the tab,
// but only as soon as it is active (due to a limitation of the browser API)
export default async function makeScreenshotOfTabAsap({ tabId }) {
    await whenPageLoadComplete({ tabId })
    await whenTabActive({ tabId })
    // Some delay appears required to not fail. Perhaps the browser needs
    // to complete some rendering before the screen is captured?
    await delay(300)
    const image = await snapNow({ tabId })
    return image
}
