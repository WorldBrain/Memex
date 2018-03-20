/* eslint-env jest */

import * as utils from './utils'

describe('URl', () => {

    test("should match simple url", () => {
        const URL = "https://www.google.com/search?q=test"
        const match = utils.matchURL(URL)
        expect(match).toBe("google")
    })

    test("should match complex url", () => {
        const URL = "https://www.google.co.in/search?q=test&rlz=1C5CHFA_enIN722IN722&oq=test&aqs=chrome..69i57j69i60l4j69i65.13361j0j1&sourceid=chrome&ie=UTF-8"
        const match = utils.matchURL(URL)
        expect(match).toBe("google")
    })

    test("should not match url", () => {
        const URL = "https://www.google.com/ie=UTF-8&&sourceid=chrome"
        const match = utils.matchURL(URL)
        expect(match).toBeFalsy()
    })
})