import { getMetadata, metadataRules } from 'page-metadata-parser'
import Readability from 'readability'

function extractPageText() {
    let article
    const loc = window.location
    const uri = {
        spec: loc.href,
        host: loc.host,
        prePath: loc.protocol + "//" + loc.host,
        scheme: loc.protocol.substr(0, loc.protocol.indexOf(":")),
        pathBase: loc.protocol + "//" + loc.host + loc.pathname.substr(0, loc.pathname.lastIndexOf("/") + 1)
    }
    try {
        article = new Readability(
            uri,
            document.cloneNode(true),
        ).parse()
    }
    catch (err) {
        // Bummer.
        console.error('Readability failed', err)
    }
    // Fall back to full body text if Readability failed us.
    const text = article ? article.textContent : document.body.innerText
    return text
}

// Get the basic info and text content (for search index) of this page.
function gatherPageInfo() {
    // Extract info from all sorts of meta tags (og, twitter, etc.)
    const visitedUrl = window.location.href
    const text = extractPageText()
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
