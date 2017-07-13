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
        const doc = parser.parseFromString(
            '<html><head></head><body></body></html>',
            'text/html'
        )
        removeNode(doc.querySelector('head'))
        expect(doc.querySelector('head')).toBeNull()
    })
})

describe('urlToDataUri', () => {
    test('should return a dataUri given a URL', async () => {
        const someDataUri = 'data:text/html,<h1>bananas</h1>'
        const spy = jest.spyOn(responseToDataUri, 'default').mockImplementation(async () => {
            return someDataUri
        })
        const dataUri = await urlToDataUri('https://example.com/page')
        expect(dataUri).toBe(someDataUri)
        spy.mockRestore()
    })

    test('should return a "about:invalid" upon failure', async () => {
        const spy = jest.spyOn(responseToDataUri, 'default').mockImplementation(async () => {
            throw new Error('mock error')
        })
        const dataUri = await urlToDataUri('http://example.com')
        expect(dataUri).toBe('about:invalid')
        spy.mockRestore()
    })

    test('should return a "about:invalid" when fetching fails', async () => {
        fetch.mockRejectOnce()
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
        const doc = parser.parseFromString(
            '<html><body><img src="public/image/background.png" alt="background" /></body></html>',
            'text/html'
        )
        const rootElement = doc.documentElement
        await inlineUrlsInAttributes({elements: 'img', attributes: 'src', rootElement, docUrl})
        expect(rootElement.querySelector('img').getAttribute('data-original-src')).toBe('public/image/background.png')
        expect(rootElement.querySelector('img').getAttribute('src')).toBe(imageDataUri)
    })

    test('should change the URL in the <link> tag to a dataUri', async () => {
        fetch.mockResponseOnce(imageBlob)
        const doc = parser.parseFromString(
            '<html><head><link rel="icon" href="public/image/favicon.ico"></head></html>',
            'text/html'
        )
        const rootElement = doc.documentElement
        await inlineUrlsInAttributes({elements: 'link', attributes: 'href', rootElement, docUrl})
        expect(rootElement.querySelector('link').getAttribute('data-original-href')).toBe('public/image/favicon.ico')
        expect(rootElement.querySelector('link').getAttribute('href')).toBe(imageDataUri)
    })

    test('should remove the attribute integrity from the tag', async () => {
        const doc = parser.parseFromString(
            `<html>
                <head>
                    <link
                        href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css"
                        rel="stylesheet"
                        integrity="sha256-MfvZlkHCEqatNoGiOXveE8FIwMzZg4W85qfrfIFBfYc="
                    >
                </head>
            </html>`,
            'text/html'
        )
        const rootElement = doc.documentElement
        await inlineUrlsInAttributes({elements: 'link', attributes: 'href', fixIntegrity: true, rootElement, docUrl})
        expect(rootElement.querySelector('link').getAttribute('integrity')).toBeNull()
    })
})
