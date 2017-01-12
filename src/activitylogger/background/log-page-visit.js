import responseToDataURI from '../../util/response-to-data-uri'
import { default as db, convertLogEntryId } from '../../pouchdb'

// We add a random string to each doc _id to prevent accidental collisions.
const randomString = () => Math.random().toString().substring(2,12)

// Return the promise of an image (as data URI) of the visible area of the tab,
// IF it is currently visible (due to a limitation of the browser API)
function makeScreenshotOfTabIfPossible({tab}) {
    return browser.tabs.query({active:true}).then(
        activeTabs => (activeTabs.map(t=>t.id).indexOf(tab.id) > -1)
    ).then(isActive => {
        if (isActive) {
            return browser.tabs.captureVisibleTab(
                tab.windowId,
                {format: 'png'}
            ).catch(err => undefined)
        }
        else {
            // No screenshot. Better next time.
            return undefined
        }
    })
}

// Get a tab's fav-icon (website logo) as a data URI
function getFavIcon({tab}) {
    return fetch(tab.favIconUrl).then(responseToDataURI).catch(
        err => undefined // carry on without fav-icon
    )
}

// Timestamp and store the data in PouchDB
function storePageVisit(data) {
    const timestamp = new Date()
    const r = db.put({
        ...data,
        timestamp: timestamp.getTime(),
        _id: convertLogEntryId({timestamp: timestamp.toJSON(), nonce: randomString()})
    })
}

export function logPageVisit({data, tab}) {
    // Try to get both a screenshot and a fav-icon, concurrently
    const screenshotPromise = makeScreenshotOfTabIfPossible({tab})
    const favIconPromise = getFavIcon({tab})
    return Promise.all([screenshotPromise, favIconPromise]).catch(
        err => console.error(err)
    ).then(
        ([screenshotDataUri=undefined, favIconDataUri=undefined]=[]) => {
            storePageVisit({
                favIcon: favIconDataUri,
                screenshot: screenshotDataUri,
                ...data
            })
        }
    )
}
