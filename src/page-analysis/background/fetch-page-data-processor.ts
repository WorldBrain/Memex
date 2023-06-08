import type { Runtime } from 'webextension-polyfill'
import type { PagePipeline } from '@worldbrain/memex-common/lib/page-indexing/pipeline'
import { isUrlPDFViewerUrl } from 'src/pdf/util'
import type { PageContent, FetchPageProcessor } from './types'
import type {
    FetchPageData,
    FetchPageDataDeps,
    PageDataResult,
} from '@worldbrain/memex-common/lib/page-indexing/fetch-page-data/types'
import { FetchPageDataError } from '@worldbrain/memex-common/lib/page-indexing/fetch-page-data/errors'

export class FetchPageDataProcessor implements FetchPageProcessor {
    constructor(
        private props: {
            runtimeAPI: Pick<Runtime.Static, 'getURL'>
            fetchPageData: FetchPageData
            fetchPDFData: FetchPageData
            pagePipeline: PagePipeline
            domParser?: (html: string) => Document
        },
    ) {}

    async process(
        url: string,
    ): Promise<{
        content: PageContent
        htmlBody?: string
        pdfFingerprints?: string[]
    }> {
        const fetchDataDeps: FetchPageDataDeps = {
            url,
            fetch: globalThis.fetch.bind(globalThis),
            domParser: this.props.domParser,
            opts: { includePageContent: true, includeFavIcon: true },
        }

        const { run: runFetch } = isUrlPDFViewerUrl(url, {
            runtimeAPI: this.props.runtimeAPI,
        })
            ? this.props.fetchPDFData(fetchDataDeps)
            : this.props.fetchPageData(fetchDataDeps)

        let fetchResult: PageDataResult
        try {
            fetchResult = await runFetch()
        } catch (err) {
            // Let temporary failures bubble up to be handled by caller
            if (err instanceof FetchPageDataError && err.isTempFailure) {
                throw err
            }

            /*
             * In the case of permanent failures, we have no data to work with apart from the URL.
             * We are making the decision here to create a non-text-searchable page with the title
             * set to the URL.
             */
            fetchResult = { content: { title: url } }
        }

        const { htmlBody, pdfFingerprints } = fetchResult
        delete fetchResult.htmlBody
        const pageData = await this.props.pagePipeline({
            pageDoc: { ...fetchResult, content: fetchResult.content!, url },
            rejectNoContent: false,
        })

        return { content: pageData, htmlBody, pdfFingerprints }
    }
}
