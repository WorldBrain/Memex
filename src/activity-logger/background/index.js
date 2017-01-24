import storeVisit from './store-visit'
import performPageAnalysis from '../../page-analysis/background'

// Filter by URL to avoid logging extension pages, newtab, etcetera.
const loggableUrlPattern = /^https?:\/\//
const shouldBeLogged = url => loggableUrlPattern.test(url)

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

    if (!shouldBeLogged(details.url))
        return

    // Consider every navigation a new visit.
    logPageVisit({
        url: details.url
    }).then(({visitId, pageId}) => {
        // Start page content analysis (text extraction, etcetera)
        performPageAnalysis({pageId, tabId: details.tabId})
    })
})
