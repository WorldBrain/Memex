import normalizeUrl from 'normalize-url'

import { normalizationOpts } from 'src/util/encode-url-for-id'
import extractPageContent from 'src/page-analysis/content_script/extract-page-content'
import extractFavIcon from 'src/page-analysis/content_script/extract-fav-icon'
import extractPdfContent from 'src/page-analysis/content_script/extract-pdf-content'

/**
 * @typedef IFetchPageDataOpts
 * @type {Object}
 * @property {boolean} includeFreezeDry Denotes whether to attempt freeze-dry fetch.
 * @property {boolean} includePageContent Denotes whether to attempt page text + metadata fetch.
 * @property {boolean} includeFavIcon Denotes whether to attempt favicon fetch.
 */
export const defaultOpts = {
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
 * @returns {any} Object containing `run` async cb and `cancel` cb to afford control over the request.
 */
export default function fetchPageData(
    { url = '', timeout = 10000, opts = defaultOpts } = { opts: defaultOpts },
) {
    const normalizedUrl = normalizeUrl(url, {
        ...normalizationOpts,
        removeQueryParameters: [/.*/i],
    })

    let run, cancel

    // Check if pdf and run code for pdf instead
    if (normalizedUrl.endsWith('.pdf')) {
        run = async () => ({
            content: opts.includePageContent
                ? await extractPdfContent({ url })
                : undefined,
        })
        cancel = () => {}
    } else {
        const req = fetchDOMFromUrl(url, timeout)
        cancel = req.cancel

        /**
         * @return {Promise<any>} Resolves to an object containing `content` and `favIconURI` data
         *  fetched from the DOM pointed at by the `url` of `fetchPageData` call.
         */
        run = async function() {
            const doc = await req.run()

            // If DOM couldn't be fetched, then we can't get anything
            if (!doc) {
                throw new Error('Cannot fetch DOM')
            }

            return {
                favIconURI: opts.includeFavIcon
                    ? await extractFavIcon(doc)
                    : undefined,
                content: opts.includePageContent
                    ? await extractPageContent(doc, url)
                    : undefined,
            }
        }
    }

    return { run, cancel }
}

/**
 * Async function that given a URL will attempt to grab the current DOM which it points to.
 * Uses native XMLHttpRequest API, as newer Fetch API doesn't seem to support fetching of
 * the DOM; the Response object must be parsed.
 *
 * @param {string} url The URL to fetch the DOM for.
 * @param {number} timeout The amount of ms to wait before throwing a fetch timeout error.
 * @returns {any} Object containing `run` async cb and `cancel` cb to afford control over the request.
 */
function fetchDOMFromUrl(url, timeout) {
    const req = new XMLHttpRequest()

    return {
        cancel: () => req.abort(),
        /**
         * @returns {Promise<Document>} Resolves to the DOM which the URL points to.
         */
        run: () =>
            new Promise((resolve, reject) => {
                // Set up timeout handling
                req.timeout = timeout
                req.ontimeout = () => reject(new Error('Data fetch timeout'))

                // General non-HTTP errors
                req.onerror = () => reject(new Error('Data fetch failed'))

                // Allow non-200 response statuses to be considered failures;
                //  non-HTTP issues also show up as 0. Add any exception cases in here.
                req.onreadystatechange = function() {
                    if (this.readyState === 4) {
                        switch (this.status) {
                            case 200:
                                return resolve(this.responseXML)
                            case 0:
                            default:
                                return req.onerror()
                        }
                    }
                }

                req.open('GET', url)

                // Sets the responseXML to be of Document/DOM type
                req.responseType = 'document'
                req.send()
            }),
    }
}
