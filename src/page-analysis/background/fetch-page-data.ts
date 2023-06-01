import { runtime } from 'webextension-polyfill'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import { fetchDOMForUrl } from '@worldbrain/memex-common/lib/page-indexing/fetch-page-data/fetch-dom-for-url'
import extractFavIcon from 'src/page-analysis/background/content-extraction/extract-fav-icon'
// import extractPdfContent from 'src/page-analysis/background/content-extraction/extract-pdf-content'
import { extractRawPageContent } from 'src/page-analysis/content_script/extract-page-content'
import extractPageMetadataFromRawContent, {
    getPageFullText,
} from './content-extraction'
import { PageDataResult } from './types'
import { FetchPageDataError } from './fetch-page-data-error'
import { isUrlPDFViewerUrl } from 'src/pdf/util'

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
    let normalizedUrl: string

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
    if (isUrlPDFViewerUrl(url, { runtimeAPI: runtime })) {
        run = async () => {
            // TODO: PDFs can no longer be processed in the BG SW, thus can't be remotely fetched like this
            return {}
            // if (opts.includePageContent) {
            //     const content = await extractPdfContent({ url, type: 'pdf' }, { tabId })
            //     return {
            //         pdfFingerprints: content.pdfMetadata.fingerprints,
            //         content,
            //     }
            // }
        }
        cancel = () => undefined
    } else {
        const req = fetchDOMForUrl(url, timeout, domParser)
        cancel = req.cancel

        run = async function (): Promise<PageDataResult> {
            const doc = await req.run()

            if (!doc) {
                throw new FetchPageDataError('Cannot fetch DOM', 'temporary')
            }

            const result: PageDataResult = {}
            if (opts.includePageContent) {
                const rawContent = extractRawPageContent(doc, url)
                const metadata = extractPageMetadataFromRawContent(rawContent)
                const fullText = getPageFullText(rawContent, metadata)

                result.content = { ...metadata, fullText }
                if (rawContent.type === 'html') {
                    result.htmlBody = rawContent.body
                }
            }
            if (opts.includeFavIcon) {
                result.favIconURI = await extractFavIcon(url, doc)
            }

            return result
        }
    }

    return { run, cancel }
}

export default fetchPageData
