/* eslint-env jest */
/* eslint import/namespace: "off" */

import * as inlineImages from 'src/freeze-dry/inline-images'
import * as common from 'src/freeze-dry/common'

describe('getUrlsFromSrcset', () => {
    test('should return URL for srcset', () => {
        expect.assertions(3)
        const srcset = 'https://example.com/background1.jpg 1x, https://example.com/background2.jpg 2x, https://example.com/background3.jpg 3x'
        const urls = inlineImages.getUrlsFromSrcset(srcset)
        expect(urls[0]).toBe('https://example.com/background1.jpg')
        expect(urls[1]).toBe('https://example.com/background2.jpg')
        expect(urls[2]).toBe('https://example.com/background3.jpg')
    })
})

describe('inlineImages', () => {
    test('should call inlineUrlsInAttributes', async () => {
        common.inlineUrlsInAttributes = jest.fn()
        const rootElement = window.document.implementation.createHTMLDocument()
        const docUrl = 'about:blank'
        await inlineImages.default({rootElement, docUrl})
        expect(common.inlineUrlsInAttributes).toHaveBeenCalledTimes(3)
    })
})
