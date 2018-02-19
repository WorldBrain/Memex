/* eslint-env jest */

import * as JSDOM from 'jsdom'
import extractPageContent from './extract-page-content'

describe('Extract page content', () => {
    // beforeAll(() => {
    //     browser.extension = {
    //         getURL: rel => path.resolve('extension/lib', rel.substr(1)),
    //     }
    // })

    // afterAll(() => {

    // })

    test('TO FINISH: extract content from PDF', async () => {
        //     jest.setTimeout(50 * 1000)
        //     const pdfUrl =
        //         'http://cdn.linkdetox.com/wp-content/uploads/noindex/111-things-to-know-about-links.pdf'
        //     const pdfPath = path.resolve(
        //         'test-content', 'pdf',
        //         '111-things-to-know-about-links.pdf',
        //     )
        //     const data = new Uint8Array(fs.readFileSync(pdfPath))
        //     fetch.mockResponseOnce(new Blob([data], { type: 'application/pdf' }))
        //     const result = await extractPageContent(null, pdfUrl)
        //     console.log(result)
    })

    test('extract content from an HTML page', async () => {
        // eslint-disable-next-line new-cap
        const document = new JSDOM.jsdom(`
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
        const content = await extractPageContent(document, 'https://test.com')
        expect(content).toEqual({
            fullText: ' Hello world ',
            lang: 'en',
            canonicalUrl: undefined,
            title: 'My title',
            keywords: ['key words for all'],
            description: 'some kind of description',
        })
        // fs.writeFileSync('/tmp/content.txt', )
    })
})
