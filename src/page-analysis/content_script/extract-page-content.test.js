/* eslint-env jest */

import * as fs from 'fs'
import * as path from 'path'
import extractPageContent from './extract-page-content'

describe('Extract page content', () => {
    let origBrowserExtension

    beforeAll(() => {
        browser.extension = {
            getURL: rel => path.resolve('extension/lib', rel.substr(1)),
        }
    })

    // afterAll(() => {

    // })

    test('extract content from PDF', async () => {
        jest.setTimeout(50 * 1000)

        const pdfUrl =
            'http://cdn.linkdetox.com/wp-content/uploads/noindex/111-things-to-know-about-links.pdf'
        const pdfPath = path.resolve(
            'test-pdfs',
            '111-things-to-know-about-links.pdf',
        )
        const data = new Uint8Array(fs.readFileSync(pdfPath))
        fetch.mockResponseOnce(new Blob([data], { type: 'application/pdf' }))
        const result = await extractPageContent(null, pdfUrl)
        console.log(result)
    })
})
