import { whenPageDOMLoaded } from '../../util/tab-events'
import performPageAnalysis from '../../page-analysis/background'
import storeVisit from './store-visit'
import { isWorthRemembering } from '..'

// Create a visit/page pair in the database for the given URL.
function logPageVisit({url}) {
    const timestamp = new Date()

    const pageInfo = {
        url,
    }
    const visitInfo = {
        url,
        visitStart: timestamp.getTime(),
    }

    return storeVisit({timestamp, visitInfo, pageInfo})
}

// Listen for navigations to log them and analyse the pages.
browser.webNavigation.onCommitted.addListener(details => {
    // Ignore pages loaded in frames, it is usually noise.
    if (details.frameId !== 0)
        return

    if (!isWorthRemembering({url: details.url}))
        return

    // Consider every navigation a new visit.
    logPageVisit({
        url: details.url
    }).then(
        // Wait until its DOM has loaded.
        value => whenPageDOMLoaded({tabId: details.tabId}).then(()=>value)
    ).then(({visitId, pageId}) => {
        // Start page content analysis (text extraction, etcetera)
        performPageAnalysis({pageId, tabId: details.tabId})
    })
})
