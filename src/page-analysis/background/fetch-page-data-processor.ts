import { PagePipeline } from 'src/search/pipeline'
import { FetchPageData } from './fetch-page-data'
import { FetchPageDataError } from './fetch-page-data-error'
import { PageDataResult, PageContent, FetchPageProcessor } from './types'

export class FetchPageDataProcessor implements FetchPageProcessor {
    constructor(
        private props: {
            fetchPageData: FetchPageData
            pagePipeline: PagePipeline
        },
    ) {}

    async process(url: string): Promise<PageContent> {
        const fetch = this.props.fetchPageData({
            url,
            opts: { includePageContent: true, includeFavIcon: true },
        })

        let fetchResult: PageDataResult

        try {
            fetchResult = await fetch.run()
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

        const pageData = await this.props.pagePipeline({
            pageDoc: { ...fetchResult, url },
            rejectNoContent: false,
        })

        return pageData
    }
}
