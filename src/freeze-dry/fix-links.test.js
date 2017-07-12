/* eslint-env jest */

import fixLinks from 'src/freeze-dry/fix-links'

describe('fixLinks', () => {
    const docUrl = 'https://example.com/page'

    test('should call the function to prepend the base element', async () => {
        const rootElement = window.document.implementation.createHTMLDocument()
        rootElement.querySelector('head').insertAdjacentElement = jest.fn()
        const docUrl = 'about:blank'
        await fixLinks({rootElement, docUrl})
        const base = document.createElement('base')
        base.href = docUrl
        expect(rootElement.querySelector('head').insertAdjacentElement).toBeCalledWith('afterbegin', base) // for some reason the insertAdjacentElement doesn't work with jsdom. this test is a placeholder for when a better solution arises
    })

    test('should do nothing for absolute URLs', async () => {
        const rootElement = window.document.createElement('div')
        rootElement.innerHTML = '<a href="https://example.com/#home">Link</a>'
        await fixLinks({rootElement, docUrl})
        expect(rootElement.querySelector('*[href]').getAttribute('href')).toBe('https://example.com/#home')
    })

    test('should correct relative URLs', async () => {
        const rootElement = window.document.createElement('div')
        rootElement.innerHTML = '<a href="#home">Link</a>'
        await fixLinks({rootElement, docUrl})
        expect(rootElement.querySelector('*[href]').getAttribute('href')).toBe('https://example.com/page#home')
    })

    test('should not alter inline javascript in href attribute', async () => {
        const rootElement = window.document.createElement('div')
        rootElement.innerHTML = `<a href="javascript:alert('Hello');">Link</a>`
        await fixLinks({rootElement, docUrl})
        expect(rootElement.querySelector('*[href]').getAttribute('href')).toBe(`javascript:alert('Hello');`)
    })

    test('should not alter mailto scripts in href attribute', async () => {
        const rootElement = window.document.createElement('div')
        rootElement.innerHTML = `<a href="mailto:someone@example.com">Link</a>`
        await fixLinks({rootElement, docUrl})
        expect(rootElement.querySelector('*[href]').getAttribute('href')).toBe(`mailto:someone@example.com`)
    })

    test('should not alter data urls in href attribute', async () => {
        const datauri = 'data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABGdBTUEAALGP C/xhBQAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9YGARc5KB0XV+IA AAAddEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIFRoZSBHSU1Q72QlbgAAAF1J REFUGNO9zL0NglAAxPEfdLTs4BZM4DIO4C7OwQg2JoQ9LE1exdlYvBBeZ7jq ch9//q1uH4TLzw4d6+ErXMMcXuHWxId3KOETnnXXV6MJpcq2MLaI97CER3N0 vr4MkhoXe0rZigAAAABJRU5ErkJggg=='
        const rootElement = window.document.createElement('div')
        rootElement.innerHTML = `<a href="${datauri}">Link</a>`
        await fixLinks({rootElement, docUrl})
        expect(rootElement.querySelector('*[href]').getAttribute('href')).toBe(datauri)
    })
})
