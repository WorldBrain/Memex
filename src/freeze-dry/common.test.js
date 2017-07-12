/* eslint-env jest */

import { inlineUrlsInAttributes, urlToDataUri, removeNode } from 'src/freeze-dry/common'
import * as responseToDataUri from 'src/util/response-to-data-uri'
import { dataURLToBlob } from 'blob-util'

const imageDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg=='

beforeEach(() => {
    fetch.resetMocks()
})

describe('removeNode', () => {
    test('should remove the node', () => {
        const parser = new DOMParser()
        const rootElement = parser.parseFromString(
            '<html><head></head><body></body></html>',
            'text/html'
        )
        removeNode(rootElement.querySelector('head'))
        expect(rootElement.querySelector('head')).toBeNull()
    })
})

describe('urlToDataUri', () => {
    test('should return a valid dataUri for a URL', async () => {
        const spy = jest.spyOn(responseToDataUri, 'default')
        await urlToDataUri('https://example.com/page')
        expect(spy).toHaveBeenCalled()
        spy.mockRestore()
    })

    test('should return a "about:invalid" upon failure', async () => {
        expect.assertions(2)
        const spy = jest.spyOn(responseToDataUri, 'default').mockImplementation(() => {
            throw new Error('mock error')
        })
        const dataUri = await urlToDataUri('http://example.com')
        expect(spy).toHaveBeenCalled()
        expect(dataUri).toBe('about:invalid')
        spy.mockRestore()
    })

    test('should return a "about:invalid" when fetching fails', async () => {
        fetch.mockReject()
        const dataUri = await urlToDataUri('http://example.com')
        expect(dataUri).toBe('about:invalid')
    })
})

describe('inlineUrlsInAttributes', () => {
    const docUrl = 'https://example.com/page'
    const parser = new DOMParser()
    let imageBlob

    beforeAll(async () => {
        imageBlob = await dataURLToBlob(imageDataUri)
    })

    test('should change the URL in <img> tag to a dataUri', async () => {
        fetch.mockResponseOnce(imageBlob)
        expect.assertions(2)
        const rootElement = parser.parseFromString(
            '<html><body><img src="public/image/background.png" alt="background" /></body></html>',
            'text/html'
        )
        await inlineUrlsInAttributes({elements: 'img', attributes: 'src', rootElement, docUrl})
        expect(rootElement.querySelector('img').getAttribute('data-original-src')).toBe('public/image/background.png')
        expect(rootElement.querySelector('img').getAttribute('src')).toBe(imageDataUri)
    })

    test('should change the URL in the <link> tag to a dataUri', async () => {
        fetch.mockResponseOnce(imageBlob)
        expect.assertions(2)
        const rootElement = parser.parseFromString(
            '<html><head><link rel="icon" href="public/image/favicon.ico"></head></html>',
            'text/html'
        )
        await inlineUrlsInAttributes({elements: 'link', attributes: 'href', fixIntegrity: true, rootElement, docUrl})
        expect(rootElement.querySelector('link').getAttribute('data-original-href')).toBe('public/image/favicon.ico')
        expect(rootElement.querySelector('link').getAttribute('href')).toBe(imageDataUri)
    })

    test('should change the URL in srcset of the <img> tag to a dataUri', async () => {
        fetch.mockResponseOnce(imageBlob)
        expect.assertions(2)
        const rootElement = parser.parseFromString(
            '<html><body><img src="background.png" alt="background" srcset="background.png 200w,background.png 400w"></body></html>',
            'text/html'
        )
        await inlineUrlsInAttributes({elements: 'img', attributes: 'srcset', fixIntegrity: true, rootElement, docUrl})
        expect(rootElement.querySelector('img').getAttribute('data-original-srcset')).toBe('background.png 200w,background.png 400w')
        expect(rootElement.querySelector('img').getAttribute('srcset')).toBe(imageDataUri)
    })

    test('should remove the attribute integrity from the tag', async () => {
        const rootElement = parser.parseFromString(
            '<html><head><link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css" rel="stylesheet" integrity="sha256-MfvZlkHCEqatNoGiOXveE8FIwMzZg4W85qfrfIFBfYc= sha512-dTfge/zgoMYpP7QbHy4gWMEGsbsdZeCXz7irItjcC3sPUFtf0kuFbDz/ixG7ArTxmDjLXDmezHubeNikyKGVyQ==" crossorigin="anonymous"></head></html>',
            'text/html'
        )
        await inlineUrlsInAttributes({elements: 'link', attributes: 'href', fixIntegrity: true, rootElement, docUrl})
        expect(rootElement.querySelector('link').getAttribute('integrity')).toBeNull()
    })
})
