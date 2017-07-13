/* eslint-env jest */
/* eslint import/namespace: "off" */

import inlineImages, { getUrlsFromSrcset } from 'src/freeze-dry/inline-images'
import * as common from 'src/freeze-dry/common'


describe('getUrlsFromSrcset', () => {
    test('should return URLs for srcset', () => {
        const srcset = 'https://example.com/background1.jpg 0.5x, https://example.com/background2.jpg 1x, background3.jpg 2x'
        const urls = getUrlsFromSrcset(srcset)
        expect(urls[0]).toBe('https://example.com/background1.jpg')
        expect(urls[1]).toBe('https://example.com/background2.jpg')
        expect(urls[2]).toBe('background3.jpg')
    })
})

describe('inlineImages', () => {
    test('should call inlineUrlsInAttributes', async () => {
        common.inlineUrlsInAttributes = jest.fn()
        const doc = window.document.implementation.createHTMLDocument()
        const rootElement = doc.documentElement
        await inlineImages({rootElement, docUrl: 'about:blank'})
        expect(common.inlineUrlsInAttributes).toHaveBeenCalledTimes(3)
    })
})
