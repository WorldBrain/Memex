/* eslint-env jest */

import setContentSecurityPolicy from 'src/freeze-dry/set-content-security-policy'


describe('setContentSecurityPolicy', () => {
    test('should insert <meta> element at beginning of <head>', () => {
        const policyDirectives = [
            "default-src 'none'",
            "img-src data:",
            "style-src data: 'unsafe-inline'",
            "font-src data:",
        ]
        const doc = window.document.implementation.createHTMLDocument()
        // XXX insertAdjacentElement is not yet implemented in jsdom. This test is a placeholder
        // until a better solution arises.
        doc.querySelector('head').insertAdjacentElement = jest.fn()
        setContentSecurityPolicy({doc, policyDirectives})
        expect(doc.querySelector('head').insertAdjacentElement).toHaveBeenCalled()
    })
})
