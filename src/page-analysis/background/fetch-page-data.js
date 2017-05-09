import extractPageContent from 'src/page-analysis/content_script/extract-page-content'

/**
 * Given a URL will attempt an async fetch of the text and metadata from the page
 * which the URL points to.
 *
 * @param {string} url The URL which points to the page to fetch text + meta-data for.
 * @return {any} Object containing `text` and `metadata` objects containing given data
 *  for the found page pointed at by the URL.
 */
export default async function fetchPageData({
    url = '',
} = {}) {
    const loc = getLocationFromURL(url)
    const doc = await fetchDOMFromUrl(url)
    // If DOM couldn't be fetched, then we can't get text/metadata
    if (!doc) { throw new Error(`Cannot get DOM from URL: ${url}`) }

    const { text, metadata, favIcon } = await extractPageContent({ doc, loc, url })
    return { text, metadata, favIcon }
}

/**
 * Given a URL string, converts it to a Location-interface compatible object.
 * Uses experimental URL API: https://developer.mozilla.org/en/docs/Web/API/URL
 *
 * @param {string} url The URL to get Location-interface object for.
 * @return {Location} A Location-interface compatible object.
 */
const getLocationFromURL = url => new URL(url)

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
    req.onerror = () => reject(new Error(`Failed XHR fetching for URL: ${url}`))

    req.open('GET', url)

    // Sets the responseXML to be of Document/DOM type
    req.responseType = 'document'
    req.send()
})
