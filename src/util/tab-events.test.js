/* eslint-env jest */

import {
    whenPageDOMLoaded,
    whenPageLoadComplete,
    whenTabActive,
} from './tab-events'
import * as eventToPromise from './event-to-promise'

describe('whenPageDOMLoaded', () => {
    const tabId = 1

    beforeEach(() => {
        browser.tabs = {}
        browser.webNavigation = {
            onCommitted: jest.fn(),
        }
        eventToPromise.default = jest.fn().mockReturnValue(Promise.resolve())
    })

    test('should execute script and resolve promise if script executes', async () => {
        browser.tabs = {
            executeScript: jest.fn().mockReturnValue(Promise.resolve()),
        }
        await whenPageDOMLoaded({ tabId })
        expect(browser.tabs.executeScript).toHaveBeenCalledWith(tabId, {
            code: 'undefined',
            runAt: 'document_end',
        })
    })

    test('should reject the promise if the script is not executed', async () => {
        expect.assertions(1)
        browser.tabs = {
            executeScript: jest
                .fn()
                .mockReturnValue(
                    Promise.reject(new Error('Script unable to execute')),
                ),
        }
        try {
            await whenPageDOMLoaded({ tabId })
        } catch (err) {
            expect(err.message).toBe('Script unable to execute')
        }
    })

    test.skip('should reject the promise if tab is changed', async () => {
        expect.assertions(1)
        browser.tabs = {
            executeScript: jest
                .fn()
                .mockReturnValue(new Promise((resolve, reject) => {})),
        }
        eventToPromise.default = jest
            .fn()
            .mockReturnValue(Promise.reject(new Error('Tab was changed')))
        await expect(whenPageDOMLoaded({ tabId })).rejects.toMatchObject({
            message: 'Tab was changed',
        })
    })
})

describe('whenPageLoadComplete', () => {
    const tabId = 1

    beforeEach(() => {
        eventToPromise.default = jest.fn().mockReturnValue(Promise.resolve())
        browser.webNavigation = {
            onCommitted: jest.fn(),
        }
    })

    test('should return directly if the tab status is complete', async () => {
        browser.tabs = {
            get: jest.fn().mockReturnValueOnce({
                status: 'complete',
            }),
        }
        await whenPageLoadComplete({ tabId })
        expect(browser.tabs.get).toHaveBeenCalledWith(tabId)
        expect(eventToPromise.default).not.toHaveBeenCalled()
    })

    test('should run eventToPromise and resolve if its Promise resolves', async () => {
        browser.tabs = {
            get: jest.fn().mockReturnValueOnce({
                status: 'loading',
            }),
        }
        // Add a 'shibboleth' to be able to check that *this* Promise was returned & resolved.
        eventToPromise.default.mockReturnValueOnce(
            Promise.resolve('shibboleth'),
        )
        await expect(whenPageLoadComplete({ tabId })).resolves.toBe(
            'shibboleth',
        )
    })

    test.skip('should run eventToPromise and reject if its Promise rejects', async () => {
        browser.tabs = {
            get: jest.fn().mockReturnValueOnce({
                status: 'loading',
            }),
        }
        eventToPromise.default = jest
            .fn()
            .mockReturnValue(Promise.reject(new Error('Tab was changed')))
        await expect(whenPageLoadComplete({ tabId })).rejects.toMatchObject({
            message: 'Tab was changed',
        })
    })
})

describe('whenTabActive', () => {
    beforeEach(() => {
        eventToPromise.default = jest.fn().mockReturnValue(Promise.resolve())
        browser.webNavigation = {
            onCommitted: jest.fn(),
        }
    })

    test('should return directly if the tab is already active', async () => {
        browser.tabs = {
            query: jest.fn().mockReturnValueOnce([{ id: 1 }]),
        }
        await whenTabActive({ tabId: 1 })
        expect(browser.tabs.query).toHaveBeenCalledWith({ active: true })
        expect(eventToPromise.default).not.toHaveBeenCalled()
    })

    test('should run eventToPromise and resolve if its Promise resolves', async () => {
        browser.tabs = {
            query: jest.fn().mockReturnValueOnce([{ id: 2 }]),
        }
        // Add a 'shibboleth' to be able to check that *this* Promise was returned & resolved.
        eventToPromise.default.mockReturnValueOnce(
            Promise.resolve('shibboleth'),
        )
        await expect(whenTabActive({ tabId: 1 })).resolves.toBe('shibboleth')
    })

    test.skip('should run eventToPromise and reject if its Promise rejects', async () => {
        browser.tabs = {
            query: jest.fn().mockReturnValueOnce([{ id: 2 }]),
        }
        eventToPromise.default = jest
            .fn()
            .mockReturnValue(Promise.reject(new Error('Tab was changed')))
        await expect(whenTabActive({ tabId: 1 })).rejects.toMatchObject({
            message: 'Tab was changed',
        })
    })
})
