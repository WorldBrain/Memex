import { normalizeUrl } from '@worldbrain/memex-url-utils'

import extractFavIcon from 'src/page-analysis/background/content-extraction/extract-fav-icon'
import extractPdfContent from 'src/page-analysis/background/content-extraction/extract-pdf-content'
import extractRawPageContent from 'src/page-analysis/content_script/extract-page-content'
import extractPageMetadataFromRawContent, {
    getPageFullText,
} from './content-extraction'
import { PageDataResult } from './types'
import { FetchPageDataError } from './fetch-page-data-error'
import fetchLocalOrRemote from 'src/util/fetchLocal'

export type FetchPageData = (args: {
    url: string
    timeout?: number
    domParser?: (html: string) => Document
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
    domParser,
    opts = defaultOpts,
}) => {
    let normalizedUrl

    try {
        normalizedUrl = JSON.stringify(
            normalizeUrl(url, {
                removeQueryParameters: [/.*/i],
            }),
        )
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
        const req = fetchDOMFromUrl(url, timeout, domParser)
        cancel = req.cancel

        /**
         * @return {Promise<any>} Resolves to an object containing `content` and `favIconURI` data
         *  fetched from the DOM pointed at by the `url` of `fetchPageData` call.
         */
        run = async function () {
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
    const promise = fetchLocalOrRemote(url, {
        signal: controller.signal,
        ...options,
    })
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
export function fetchDOMFromUrl(
    url: string,
    timeout: number,
    domParser?: (html: string) => Document,
): { run: () => Promise<Document>; cancel: CancelXHR } {
    const controller = new AbortController()

    return {
        cancel: () => controller.abort(),
        run: async () => {
            try {
                const response = await fetchTimeout(url, timeout, {
                    signal: controller.signal,
                })

                if (response.status !== 200) {
                    switchOnResponseErrorStatus(response.status)
                }
                const text = await response.text()

                const doc = domParser
                    ? domParser(text)
                    : new DOMParser().parseFromString(text, 'text/html')

                return doc
            } catch (error) {
                if (error.name === 'AbortError') {
                    throw new FetchPageDataError(
                        'Data fetch timeout',
                        'temporary',
                    )
                } else {
                    throw error
                }
            }
        },
    }
}

function switchOnResponseErrorStatus(status: number) {
    switch (status) {
        case 429:
            throw new FetchPageDataError(
                'Too many requests to server',
                'temporary',
            )
        case 500:
        case 503:
        case 504:
            throw new FetchPageDataError(
                status + ' ' + 'Server currently unavailable',
                'temporary',
            )
        default:
            throw new FetchPageDataError(
                status + ' ' + 'Data fetch failed',
                'permanent',
            )
    }
}
