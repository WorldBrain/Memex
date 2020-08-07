import { fetchDOMFromUrl } from 'src/page-analysis/background/fetch-page-data'
import Readability from 'readability/Readability'
import { JSDOM } from 'jsdom'

describe('Reader tests', () => {
    it('parses correctly', async () => {
        const fullUrl = 'https://en.wikipedia.org/wiki/Memex'
        console.log(`Fetching ${fullUrl}`)

        const domParser = (html) =>
            new JSDOM(html, {
                url: fullUrl,
            }).window.document

        const fullDoc = await fetchDOMFromUrl(fullUrl, 5000, domParser).run()
        const read = new Readability(fullDoc)
        const readable = read.parse()
        console.dir(readable)
    })

    // it('parsers correctly 2', async () => {
    //
    //     const fetchPageDataProcessor = new FetchPageDataProcessor({
    //         fetchPageData,
    //         pagePipeline: pipeline,
    //         domParser: (html) =>
    // })
})
