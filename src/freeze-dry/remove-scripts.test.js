/* eslint-env jest */

import removeScripts from 'src/freeze-dry/remove-scripts'


describe('removeScripts', () => {
    test('should remove script tags from the document', async () => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(
            '<html><head><script></script></head></html>',
            'text/html'
        )
        const rootElement = doc.documentElement
        const docUrl = 'about:blank'
        await removeScripts({rootElement, docUrl})
        expect(rootElement.getElementsByTagName('script').length).toBe(0)
    })

    test('should remove "on" handlers', async () => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(
            '<html><div onmouseover="handler()" onClick="handler()"></div></html>',
            'text/html'
        )
        const rootElement = doc.documentElement
        const docUrl = 'about:blank'
        await removeScripts({rootElement, docUrl})
        expect(rootElement.querySelector('div').attributes.length).toBe(0)
    })
})
