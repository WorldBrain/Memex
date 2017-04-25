import extractPageText from 'src/page-analysis/content_script/extract-page-text'
import extractPageMetadata from 'src/page-analysis/content_script/extract-page-metadata'

/**
 * Given a URL will attempt an async fetch of the text and metadata from the page
 * which the URL points to.
 *
 * @param {string} url The URL which points to the page to fetch text + meta-data for.
 * @return {any}
 */
export default async function fetchPageData({
    url = '',
} = {}) {
    const document = fetchDOMFromUrl(url)
    return document
}

/**
 * Given a URL string, converts it to a Location-interface compatible object.
 *
 * @param {string} url The URL to get Location-interface object for.
 * @return {Location} A Location-interface compatible object.
 */
const getLocationFromURL = url => {
    // This works through some weird stuff; more details here:
    //  https://developer.mozilla.org/en-US/docs/Web/API/Location#Examples
    // I think it's better to use the URL API later on, but right now MDN
    //  says it's experimental; maybe discuss more later:
    //  https://developer.mozilla.org/en/docs/Web/API/URL
    const dummyEl = document.createElement('a')
    dummyEl.href = url
    return dummyEl
}

/**
 * Async function that given a URL will attempt to grab the current DOM which it points to.
 * Uses native XMLHttpRequest API, as newer Fetch API doesn't seem to support fetching of
 * the DOM; the Response object must be parsed.
 *
 * @param {string} url The URL to fetch the DOM for.
 * @return {Document} The DOM which the URL points to.
 */
const fetchDOMFromUrl = async url => new Promise((resolve, reject) => {
    const req = new XMLHttpRequest()

    req.onload = () => resolve(req.responseXML)
    req.onerror = () => reject(req.statusText)

    req.open('GET', url)

    // Sets the responseXML to be of Document/DOM type
    req.responseType = 'document'
    req.send()
})
