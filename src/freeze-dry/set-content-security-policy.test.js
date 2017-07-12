/* eslint-env jest */

import setContentSecurityPolicy from 'src/freeze-dry/set-content-security-policy'

describe('setContentSecurityPolicy', () => {
    test('should call insertAdjacentElement once when head is present', () => {
        const policyDirectives = [
            "default-src 'none'",
            "img-src data:",
            "style-src data: 'unsafe-inline'",
            "font-src data:",
        ]
        const doc = window.document.implementation.createHTMLDocument()
        doc.querySelector('head').insertAdjacentElement = jest.fn()
        setContentSecurityPolicy({doc, policyDirectives})
        expect(doc.querySelector('head').insertAdjacentElement).toHaveBeenCalled()
    })
})
