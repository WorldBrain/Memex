/* eslint-env jest */

import { remoteFunction } from './webextensionRPC'

describe('remoteFunction', () => {
    beforeEach(() => {
        browser.runtime = {
            sendMessage: jest.fn(() => Promise.resolve()),
        }
        browser.tabs = {
            sendMessage: jest.fn(() => Promise.resolve()),
        }
    })

    test('should create a function', () => {
        const remoteFunc = remoteFunction('remoteFunc', { tabId: 1 })
        expect(remoteFunc.name).toBe('remoteFunc_RPC')
        expect(typeof remoteFunc).toBe('function')
    })

    test.skip('should throw an error when unable to sendMessage', async () => {
        const remoteFunc = remoteFunction('remoteFunc', { tabId: 1 })
        browser.tabs.sendMessage.mockImplementationOnce(() => {
            throw new Error()
        })
        await expect(remoteFunc()).rejects.toMatchObject({
            message: `Got no response when trying to call 'remoteFunc'. Did you enable RPC in the tab's content script?`,
        })
    })

    test('should call the browser.tabs function when tabId is given', async () => {
        const remoteFunc = remoteFunction('remoteFunc', { tabId: 1 })
        try {
            await remoteFunc()
        } catch (e) {}
        expect(browser.tabs.sendMessage).toHaveBeenCalledTimes(1)
        expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(0)
    })

    test('should call the browser.runtime function when tabId is undefined', async () => {
        const remoteFunc = remoteFunction('remoteFunc')
        try {
            await remoteFunc()
        } catch (e) {}
        expect(browser.tabs.sendMessage).toHaveBeenCalledTimes(0)
        expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(1)
    })

    test.skip('should throw an error if response does not contain RPC token', async () => {
        const remoteFunc = remoteFunction('remoteFunc', { tabId: 1 })
        await expect(remoteFunc()).rejects.toMatchObject({
            message: 'RPC got a response from an interfering listener.',
        })
    })

    test.skip('should throw an error if the response contains an error message', async () => {
        browser.tabs.sendMessage.mockReturnValueOnce({
            __RPC_RESPONSE__: '__RPC_RESPONSE__',
            errorMessage: 'Remote function error',
        })
        const remoteFunc = remoteFunction('remoteFunc', { tabId: 1 })
        await expect(remoteFunc()).rejects.toMatchObject({
            message: 'Remote function error',
        })
    })

    test('should return the value contained in the response', async () => {
        browser.tabs.sendMessage.mockReturnValueOnce({
            __RPC_RESPONSE__: '__RPC_RESPONSE__',
            returnValue: 'Remote function return value',
        })
        const remoteFunc = remoteFunction('remoteFunc', { tabId: 1 })
        await expect(remoteFunc()).resolves.toBe('Remote function return value')
    })
})
