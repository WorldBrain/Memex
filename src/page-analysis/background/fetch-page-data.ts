import { normalizeUrl } from '@worldbrain/memex-url-utils'

import extractFavIcon from 'src/page-analysis/background/content-extraction/extract-fav-icon'
import extractPdfContent from 'src/page-analysis/background/content-extraction/extract-pdf-content'
import extractRawPageContent from 'src/page-analysis/content_script/extract-page-content'
import extractPageMetadataFromRawContent, {
    getPageFullText,
} from './content-extraction'
import { PageDataResult } from './types'
import { FetchPageDataError } from './fetch-page-data-error'

export type FetchPageData = (args: {
    url: string
    timeout?: number
    opts?: FetchPageDataOpts
}) => FetchPageDataReturnValue
export type RunXHR = () => Promise<PageDataResult>
export type CancelXHR = () => void

export interface FetchPageDataOpts {
    /** Denotes whether to attempt page text + metadata fetch. */
    includePageContent: boolean
    /** Denotes whether to attempt favicon fetch. */
    includeFavIcon: boolean
}

export interface FetchPageDataReturnValue {
    run: RunXHR
    cancel: CancelXHR
}

export const defaultOpts: FetchPageDataOpts = {
    includePageContent: false,
    includeFavIcon: false,
}

/**
 * Given a URL will attempt an async fetch of the text and metadata from the page
 * which the URL points to.
 */
const fetchPageData: FetchPageData = ({
    url,
    timeout = 10000,
    opts = defaultOpts,
}) => {
    let normalizedUrl

    try {
        normalizedUrl = normalizeUrl(url, {
            removeQueryParameters: [/.*/i],
        })
    } catch (err) {
        normalizedUrl = url
    }

    let run: RunXHR
    let cancel: CancelXHR

    // Check if pdf and run code for pdf instead
    if (normalizedUrl.endsWith('.pdf')) {
        run = async () => ({
            content: opts.includePageContent
                ? await extractPdfContent({ url })
                : undefined,
        })
        cancel = () => undefined
    } else {
        const req = fetchDOMFromUrl(url, timeout)
        cancel = req.cancel

        /**
         * @return {Promise<any>} Resolves to an object containing `content` and `favIconURI` data
         *  fetched from the DOM pointed at by the `url` of `fetchPageData` call.
         */
        run = async function() {
            const doc = await req.run()

            if (!doc) {
                throw new FetchPageDataError('Cannot fetch DOM', 'temporary')
            }

            const extractPageContent = async () => {
                const rawContent = await extractRawPageContent(doc, url)
                const metadata = await extractPageMetadataFromRawContent(
                    rawContent,
                )
                const fullText = await getPageFullText(rawContent, metadata)
                return { ...metadata, fullText }
            }

            return {
                favIconURI: opts.includeFavIcon
                    ? await extractFavIcon(url, doc)
                    : undefined,
                content: opts.includePageContent
                    ? await extractPageContent()
                    : undefined,
            }
        }
    }

    return { run, cancel }
}

export default fetchPageData

const fetchTimeout = (
    url,
    ms,
    { signal, ...options }: { signal?: AbortSignal } = {},
) => {
    const controller = new AbortController()
    const promise = fetch(url, { signal: controller.signal, ...options })
    if (signal) {
        signal.addEventListener('abort', () => controller.abort())
    }
    const timeout = setTimeout(() => controller.abort(), ms)
    return promise.finally(() => clearTimeout(timeout))
}

/**
 * Async function that given a URL will attempt to grab the current DOM which it points to.
 * Uses native XMLHttpRequest API, as newer Fetch API doesn't seem to support fetching of
 * the DOM; the Response object must be parsed.
 */
function fetchDOMFromUrl(
    url: string,
    timeout: number,
): { run: () => Promise<Document>; cancel: CancelXHR } {
    const controller = new AbortController()

    return {
        cancel: () => controller.abort(),
        run: () =>
            new Promise((resolve, reject) => {
                fetchTimeout(url, timeout, { signal: controller.signal })
                    .then(response => {
                        switch (response.status) {
                            case 200:
                                return response.text()
                            case 429:
                                throw new FetchPageDataError(
                                    'Too many requests',
                                    'temporary',
                                )
                            case 500:
                            case 503:
                            case 504:
                                throw new FetchPageDataError(
                                    'Server currently unavailable',
                                    'temporary',
                                )
                            default:
                                throw new FetchPageDataError(
                                    'Data fetch failed',
                                    'permanent',
                                )
                        }
                    })
                    .then(text =>
                        resolve(
                            new DOMParser().parseFromString(text, 'text/html'),
                        ),
                    )
                    .catch(error => {
                        if (error.name === 'AbortError') {
                            reject(
                                new FetchPageDataError(
                                    'Data fetch timeout',
                                    'temporary',
                                ),
                            )
                        } else {
                            reject(error)
                        }
                    })
            }),
    }
}
