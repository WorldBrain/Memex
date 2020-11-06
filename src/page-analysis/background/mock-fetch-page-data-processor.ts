import { PageContent, FetchPageProcessor } from './types'

export class MockFetchPageDataProcessor implements FetchPageProcessor {
    static DEF_PAGE: PageContent = {
        url: 'test.com',
        domain: 'test.com',
        hostname: 'test.com',
        fullTitle: 'Test',
        fullUrl: 'http://test.com',
        tags: [],
        terms: [],
        urlTerms: [],
        titleTerms: [],
        text: 'test',
    }
    lastProcessedUrl?: string

    constructor(
        private pageToProcess: PageContent = MockFetchPageDataProcessor.DEF_PAGE,
    ) {}

    set mockPage(page: PageContent) {
        this.pageToProcess = page
    }

    async process(url: string): Promise<PageContent> {
        this.lastProcessedUrl = url
        return this.pageToProcess
    }
}
