/* eslint-env jest */
import sinon from 'sinon'
import * as utils from './utils'

describe('URL', () => {
    const URLS = {
        google: {
            simple: 'https://www.google.com/search?q=test',
            spacedquery:
                'https://www.google.co.in/search?q=test+with+space&sourceid=chrome&ie=UTF-8',
            nomatch: 'https://www.google.com/ie=UTF-8&&sourceid=chrome',
            image: 'https://www.google.co.in/search?q=test&tbm=isch',
            maps:
                'https://www.google.co.in/search?q=chennai+hotels&sa=X&ved=0ahUKEwi9rqGEtbLaAhWJpI8KHVJvAyEQri4I1wEwFw&tbm=lcl',
        },
        ddg: {
            simple: 'https://duckduckgo.com/?q=test&t=canonical&ia=web',
            spacedquery: 'https://duckduckgo.com/?q=spaced+query&t=hb&ia=qa',
            nomatch: 'https://duckduckgo.com/?t=canonical&ia=web',
        },
    }

    test('should match google url', () => {
        expect(utils.matchURL(URLS.google.simple)).toBe('google')
        expect(utils.matchURL(URLS.google.spacedquery)).toBe('google')
    })

    test('should match duckduckgo url', () => {
        expect(utils.matchURL(URLS.ddg.simple)).toBe('duckduckgo')
        expect(utils.matchURL(URLS.ddg.spacedquery)).toBe('duckduckgo')
    })

    test('should not match url', () => {
        expect(utils.matchURL(URLS.google.nomatch)).toBeFalsy()
        expect(utils.matchURL(URLS.google.image)).toBeFalsy()
        expect(utils.matchURL(URLS.google.maps)).toBeFalsy()
        expect(utils.matchURL(URLS.ddg.nomatch)).toBeFalsy()
    })

    test('should fetch query', () => {
        expect(utils.fetchQuery(URLS.google.simple)).toBe('test')
        expect(utils.fetchQuery(URLS.google.spacedquery)).toBe(
            'test with space',
        )
        expect(utils.fetchQuery(URLS.ddg.simple)).toBe('test')
        expect(utils.fetchQuery(URLS.ddg.spacedquery)).toBe('spaced query')
    })
})

describe('Browser Storage Local', () => {
    test('.set should get called ', async () => {
        expect.assertions(1)
        const key = 'randomkey1'
        await utils.setLocalStorage(key, true)

        expect(browser.storage.local.set).toHaveBeenCalledWith({
            [key]: true,
        })
    })

    test('should call storage.local.get', async () => {
        expect.assertions(4)
        const keys = {
            notstored: 'key_returns_undefined',
            stored: 'key_returns_true',
            twoargs: 'key_returns_arg2',
        }
        const defaultValue = 10

        // Stub browser.storage.local.get with fake return values
        const stub = sinon.stub(browser.storage.local, 'get')
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
