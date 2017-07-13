/* eslint-env jest */

import fixLinks from 'src/freeze-dry/fix-links'


describe('fixLinks', () => {
    const docUrl = 'https://example.com/page'

    test('should insert the <base> element into <head>', async () => {
        const doc = window.document.implementation.createHTMLDocument()
        const rootElement = doc.documentElement
        doc.querySelector('head').insertAdjacentElement = jest.fn()
        const docUrl = 'about:blank'
        await fixLinks({rootElement, docUrl})
        const base = document.createElement('base')
        base.href = docUrl
        // XXX insertAdjacentElement is not yet implemented in jsdom. This test is a placeholder
        // until a better solution arises.
        expect(rootElement.querySelector('head').insertAdjacentElement)
            .toBeCalledWith('afterbegin', base)
    })

    test('should do nothing for absolute URLs', async () => {
        const rootElement = window.document.createElement('div')
        rootElement.innerHTML = '<a href="https://example.com/#home">Link</a>'
        await fixLinks({rootElement, docUrl})
        expect(rootElement.querySelector('*[href]').getAttribute('href'))
            .toBe('https://example.com/#home')
    })

    test('should make relative URLs absolute', async () => {
        const rootElement = window.document.createElement('div')
        rootElement.innerHTML = '<a href="otherpage#home">Link</a>'
        await fixLinks({rootElement, docUrl})
        expect(rootElement.querySelector('*[href]').getAttribute('href'))
            .toBe('https://example.com/otherpage#home')
    })

    test('should not alter inline javascript in href attribute', async () => {
        const rootElement = window.document.createElement('div')
        rootElement.innerHTML = `<a href="javascript:alert('Hello');">Link</a>`
        await fixLinks({rootElement, docUrl})
        expect(rootElement.querySelector('*[href]').getAttribute('href'))
            .toBe(`javascript:alert('Hello');`)
    })

    test('should not alter mailto: URIs in href attribute', async () => {
        const rootElement = window.document.createElement('div')
        rootElement.innerHTML = `<a href="mailto:someone@example.com">Link</a>`
        await fixLinks({rootElement, docUrl})
        expect(rootElement.querySelector('*[href]').getAttribute('href'))
            .toBe(`mailto:someone@example.com`)
    })

    test('should not alter data urls in href attribute', async () => {
        const datauri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg=='
        const rootElement = window.document.createElement('div')
        rootElement.innerHTML = `<a href="${datauri}">Link</a>`
        await fixLinks({rootElement, docUrl})
        expect(rootElement.querySelector('*[href]').getAttribute('href')).toBe(datauri)
    })
})
