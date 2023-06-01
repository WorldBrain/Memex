import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import { defaultOpts } from '@worldbrain/memex-common/lib/page-indexing/fetch-page-data'
import type { FetchPageData } from '@worldbrain/memex-common/lib/page-indexing/fetch-page-data/types'
// import extractPdfContent from 'src/page-analysis/background/content-extraction/extract-pdf-content'

export const fetchPDFData: FetchPageData = ({
    url,
    timeout = 10000,
    domParser,
    opts = defaultOpts,
}) => {
    let normalizedUrl: string

    try {
        // TODO: What's going on here?? Needs explanation
        normalizedUrl = JSON.stringify(
            normalizeUrl(url, {
                removeQueryParameters: [/.*/i],
            }),
        )
    } catch (err) {
        normalizedUrl = url
    }

    return {
        cancel: () => undefined,
        run: async () => {
            // TODO: PDFs can no longer be processed in the BG SW, thus can't be remotely fetched like this
            return {}
            // if (opts.includePageContent) {
            //     const content = await extractPdfContent({ url, type: 'pdf' }, { tabId })
            //     return {
            //         pdfFingerprints: content.pdfMetadata.fingerprints,
            //         content,
            //     }
            // }
        },
    }
}
