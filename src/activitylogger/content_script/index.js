import { getMetadata, metadataRules } from 'page-metadata-parser'

// Get the basic info and text content (for search index) of this page.
function gatherPageInfo() {
    // Extract info from all sorts of meta tags (og, twitter, etc.)
    const visitedUrl = window.location.href
    const text = document.body.innerText
    const pageMetadata = getMetadata(document, visitedUrl, metadataRules)
    return {
        ...pageMetadata,
        // og:url or canonical url specified by the document itself
        proclaimedUrl: pageMetadata.url,
        visitedUrl,
        text,
    }
}

// Gather the page info and send it to the background script to be logged.
function reportPageInfo() {
    const message = {
        type: 'logPageVisit',
        data: gatherPageInfo(),
    }
    browser.runtime.sendMessage(message)
        .then(reply => console.log(
            `Logging this visit in your WebMemex: ${reply.status}`
        )).catch(
            err => console.error(err)
        )
}

reportPageInfo()
