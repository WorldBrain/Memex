/* eslint-env jest */
import sinon from 'sinon'
import * as utils from './utils'

describe('URL', () => {
    const URLS = {
        simple: "https://www.google.com/search?q=test",
        complex: "https://www.google.co.in/search?q=test+with+space&rlz=1C5CHFA_enIN722IN722&oq=test&aqs=chrome..69i57j69i60l4j69i65.13361j0j1&sourceid=chrome&ie=UTF-8",
        nomatch: "https://www.google.com/ie=UTF-8&&sourceid=chrome"
    }

    test("should match url", () => {
        const result1 = utils.matchURL(URLS.simple)
        const result2 = utils.matchURL(URLS.complex)
        expect(result1).toBe("google")
        expect(result2).toBe("google")
    })

    test("should not match url", () => {
        const result = utils.matchURL(URLS.nomatch)
        expect(result).toBeFalsy()
    })
})

describe('Browser Storage Local', () => {

    test('.set should get called ', async () => {
        expect.assertions(1)
        const key = "randomkey1"
        await utils.setLocalStorage(key, true)

        expect(browser.storage.local.set).toHaveBeenCalledWith({
            [key]: true,
        })
    })

    test('should call storage.local.get', async () => {
        expect.assertions(4)
        const keys = {
            notstored: "key_returns_undefined",
            stored: "key_returns_true",
            twoargs: "key_returns_arg2"
        }
        const defaultValue = 10;

        // Stub browser.storage.local.get with fake return values
        const stub = sinon.stub(browser.storage.local, "get")
        stub.withArgs(keys.notstored).resolves({})
        stub.withArgs(keys.twoargs).resolves({})
        stub.withArgs(keys.stored).resolves({
            [keys.stored]: true,
        })

        // Fetch a key that isn't stored
        const value1 = await utils.getLocalStorage(keys.notstored)
        expect(value1).toBeUndefined()

        // Fetch a key that has value stored
        const value2 = await utils.getLocalStorage(keys.stored)
        expect(value2).toBeTruthy()

        // Pass key, default value as parameter
        const value3 = await utils.getLocalStorage(keys.twoargs, defaultValue)
        expect(browser.storage.local.set).toHaveBeenCalled()
        expect(value3).toBe(defaultValue)
    })
})