/* eslint-env jest */

import removeNoscripts from 'src/freeze-dry/remove-noscripts'
import * as common from 'src/freeze-dry/common'


describe('removeNoscripts', () => {
    test('should call removeNode for every <noscript> tag', () => {
        const spy = jest.spyOn(common, 'removeNode')
        const parser = new DOMParser()
        const doc = parser.parseFromString(
            '<html><head><noscript>No script was loaded</noscript><noscript>Your browser does not support JavaScript</noscript></head></html>',
            'text/html'
        )
        const rootElement = doc.documentElement
        removeNoscripts({rootElement})
        expect(spy).toHaveBeenCalledTimes(2)
    })

    test('should remove all the <noscript> tags from the node', () => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(
            '<html><head><noscript>No script was loaded</noscript><noscript>Your browser does not support JavaScript</noscript></head></html>',
            'text/html'
        )
        const rootElement = doc.documentElement
        removeNoscripts({rootElement})
        expect(rootElement.querySelector('noscript')).toBeNull()
    })
})
