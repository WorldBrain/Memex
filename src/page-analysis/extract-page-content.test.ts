/* eslint-env jest */

import { JSDOM } from 'jsdom'
import { extractRawPageContent } from '@worldbrain/memex-common/lib/page-indexing/content-extraction/extract-page-content'
import { transformPageHTML } from '@worldbrain/memex-stemmer/lib/transform-page-html'

describe('Extract page content', () => {
    // beforeAll(() => {
    //     browser.extension = {
    //         getURL: rel => path.resolve('extension/lib', rel.substr(1)),
    //     }
    // })

    // afterAll(() => {

    // })

    test('TO FINISH: extract content from PDF', async () => {
        //     const pdfUrl =
        //         'http://cdn.linkdetox.com/wp-content/uploads/noindex/111-things-to-know-about-links.pdf'
        //     const pdfPath = path.resolve(
        //         'test-content', 'pdf',
        //         '111-things-to-know-about-links.pdf',
        //     )
        //     const data = new Uint8Array(fs.readFileSync(pdfPath))
        //     fetch.mockResponseOnce(new Blob([data], { type: 'application/pdf' }))
        //     const result = await extractPageContent(null, pdfUrl)
    })

    test('extract content from an HTML page', () => {
        // eslint-disable-next-line new-cap
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>My title</title>
                <meta name="keywords" content="key words for all">
                <meta name="description" content="some kind of description">
            </head>
            <body>
                <p>Hello world</p>
            </body>
            </html>
        `)
        const rawContent = extractRawPageContent(
            dom.window.document,
            'https://test.com',
        )
        const metadata = rawContent.metadata
        const fullText = transformPageHTML({ html: rawContent.body }).text
        expect({ ...metadata, fullText }).toEqual({
            fullText: ' Hello world ',
            lang: 'en',
            canonicalUrl: undefined,
            title: 'My title',
            keywords: ['key words for all'],
            description: 'some kind of description',
        })
    })
})
