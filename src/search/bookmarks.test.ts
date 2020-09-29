import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { MockFetchPageDataProcessor } from 'src/page-analysis/background/mock-fetch-page-data-processor'

async function setup() {
    const {
        backgroundModules,
        fetchPageDataProcessor,
    } = await setupBackgroundIntegrationTest()
    const addBookmark = backgroundModules.search.searchIndex.addBookmark

    return {
        addBookmark,
        fetchPageData: fetchPageDataProcessor,
        pages: backgroundModules.pages,
    }
}

describe('src/search/bookmarks tests', () => {
    it('bookmark add should attempt to create a page via XHR if missing and no tab ID provided', async () => {
        const { addBookmark, fetchPageData, pages } = await setup()
        const testUrl = 'test.com'
        const testFullUrl = 'http://test.com'

        await pages.addPage({
            pageDoc: { url: testUrl, content: {} },
            rejectNoContent: false,
        })

        try {
            await addBookmark({ url: testFullUrl })
        } catch (err) {
        } finally {
            expect(fetchPageData.lastProcessedUrl).toEqual(testFullUrl)
        }
    })
})
