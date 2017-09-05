import extractPageContent from 'src/page-analysis/content_script/extract-page-content'
import extractFavIcon from 'src/page-analysis/content_script/extract-fav-icon'
import freezeDry from 'freeze-dry'

/**
 * @typedef IFetchPageDataOpts
 * @type {Object}
 * @property {boolean} includeFreezeDry Denotes whether to attempt freeze-dry fetch.
 * @property {boolean} includePageContent Denotes whether to attempt page text + metadata fetch.
 * @property {boolean} includeFavIcon Denotes whether to attempt favicon fetch.
 */
export const defaultOpts = {
    includeFreezeDry: false,
    includePageContent: false,
    includeFavIcon: false,
}

/**
 * Given a URL will attempt an async fetch of the text and metadata from the page
 * which the URL points to.
 *
 * @param {string} url The URL which points to the page to fetch text + meta-data for.
 * @param {number} [timeout=5000] The amount of ms to wait before throwing a fetch timeout error.
 * @param {IFetchPageDataOpts} opts
 * @return {any} Object containing `content` and `favIconURI` data fetched from the DOM pointed
 *  at by the `url` arg.
 */
export default async function fetchPageData({
    url = '',
    timeout = 10000,
    opts = defaultOpts,
} = { opts: defaultOpts }) {
    const doc = await fetchDOMFromUrl(url, timeout)
    // If DOM couldn't be fetched, then we can't get anything
    if (!doc) {
        throw new Error('Cannot fetch DOM')
    }

    return {
        favIconURI: opts.includeFavIcon ? await extractFavIcon(doc) : undefined,
        freezeDryHTML: opts.includeFreezeDry ? await freezeDry(doc, url) : undefined,
        content: opts.includePageContent ? await extractPageContent({ doc, url }) : undefined,
    }
}

/**
 * Async function that given a URL will attempt to grab the current DOM which it points to.
 * Uses native XMLHttpRequest API, as newer Fetch API doesn't seem to support fetching of
 * the DOM; the Response object must be parsed.
 *
 * @param {string} url The URL to fetch the DOM for.
 * @param {number} timeout The amount of ms to wait before throwing a fetch timeout error.
 * @return {Document} The DOM which the URL points to.
 */
const fetchDOMFromUrl = async (url, timeout) => new Promise((resolve, reject) => {
    const req = new XMLHttpRequest()

    req.timeout = timeout
    // General non-HTTP errors
    req.onerror = () => reject(new Error('Data fetch failed'))
    // Allow non-200 respons statuses to be considered failures; timeouts show up as 0
    req.onreadystatechange = function() {
        if (this.readyState === 4) {
            switch (this.status) {
                case 0: return reject(new Error('Data fetch timeout'))
                case 200: return resolve(this.responseXML)
                default: return reject(new Error('Data fetch failed'))
            }
        }
    }

    req.open('GET', url)

    // Sets the responseXML to be of Document/DOM type
    req.responseType = 'document'
    req.send()
})
