/* eslint-env jest */
/* eslint import/namespace: "off" */

import freezeDry from 'src/freeze-dry/index'
import * as inlineStyles from 'src/freeze-dry/inline-styles'
import * as removeScripts from 'src/freeze-dry/remove-scripts'
import * as inlineImages from 'src/freeze-dry/inline-images'
import * as setContentSecurityPolicy from 'src/freeze-dry/set-content-security-policy'
import * as fixLinks from 'src/freeze-dry/fix-links'
import * as removeNoscripts from './remove-noscripts'

beforeAll(() => {
    inlineStyles.default = jest.fn()
    removeScripts.default = jest.fn()
    inlineImages.default = jest.fn()
    fixLinks.default = jest.fn()
    setContentSecurityPolicy.default = jest.fn()
    removeNoscripts.default = jest.fn()
})

describe('freezeDry', () => {
    test('should call the whenAllSettled with all the jobs', async () => {
        expect.assertions(6)
        await freezeDry()
        expect(inlineStyles.default).toHaveBeenCalled()
        expect(removeScripts.default).toHaveBeenCalled()
        expect(inlineImages.default).toHaveBeenCalled()
        expect(fixLinks.default).toHaveBeenCalled()
        expect(setContentSecurityPolicy.default).toHaveBeenCalled()
        expect(removeNoscripts.default).toHaveBeenCalled()
    })

    test('should return the HTML document as a string', async () => {
        const html = await freezeDry()
        expect(html).toBe('<html><head></head><body></body></html>')
    })
})
