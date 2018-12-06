import * as expect from 'expect'
import * as jest from 'jest-mock'
import { remoteFunction, fakeRemoteFunction } from './webextensionRPC'

describe('remoteFunction', () => {
    beforeEach(() => {
        if (global) {
            global['window'] = { browser: {} }
        }

        window['browser'].runtime = {
            sendMessage: jest.fn(() => Promise.resolve()),
        }
        window['browser'].tabs = {
            sendMessage: jest.fn(() => Promise.resolve()),
        }
    })

    it('should create a function', () => {
        const remoteFunc = remoteFunction('remoteFunc', { tabId: 1 })
        expect(remoteFunc.name).toBe('remoteFunc_RPC')
        expect(typeof remoteFunc).toBe('function')
    })

    // test.skip('should throw an error when unable to sendMessage', async () => {
    //     const remoteFunc = remoteFunction('remoteFunc', { tabId: 1 })
    //     window['browser'].tabs.sendMessage.mockImplementationOnce(() => {
    //         throw new Error()
    //     })
    //     await expect(remoteFunc()).rejects.toMatchObject({
    //         message: `Got no response when trying to call 'remoteFunc'. Did you enable RPC in the tab's content script?`,
    //     })
    // })

    it('should call the browser.tabs function when tabId is given', async () => {
        const remoteFunc = remoteFunction('remoteFunc', { tabId: 1 })
        try {
            await remoteFunc()
        } catch (e) {
            // Do nothing
        }
        expect(window['browser'].tabs.sendMessage).toHaveBeenCalledTimes(1)
        expect(window['browser'].runtime.sendMessage).toHaveBeenCalledTimes(0)
    })

    it('should call the browser.runtime function when tabId is undefined', async () => {
        const remoteFunc = remoteFunction('remoteFunc')
        try {
            await remoteFunc()
        } catch (e) {
            // Do nothing
        }
        expect(window['browser'].tabs.sendMessage).toHaveBeenCalledTimes(0)
        expect(window['browser'].runtime.sendMessage).toHaveBeenCalledTimes(1)
    })

    // test.skip('should throw an error if response does not contain RPC token', async () => {
    //     const remoteFunc = remoteFunction('remoteFunc', { tabId: 1 })
    //     await expect(remoteFunc()).rejects.toMatchObject({
    //         message: 'RPC got a response from an interfering listener.',
    //     })
    // })

    // test.skip('should throw an error if the response contains an error message', async () => {
    //     window['browser'].tabs.sendMessage.mockReturnValueOnce({
    //         __RPC_RESPONSE__: '__RPC_RESPONSE__',
    //         errorMessage: 'Remote function error',
    //     })
    //     const remoteFunc = remoteFunction('remoteFunc', { tabId: 1 })
    //     await expect(remoteFunc()).rejects.toMatchObject({
    //         message: 'Remote function error',
    //     })
    // })

    it('should return the value contained in the response', async () => {
        window['browser'].tabs.sendMessage.mockReturnValueOnce({
            __RPC_RESPONSE__: '__RPC_RESPONSE__',
            returnValue: 'Remote function return value',
        })
        const remoteFunc = remoteFunction('remoteFunc', { tabId: 1 })
        await expect(remoteFunc()).resolves.toBe('Remote function return value')
    })

    it('should create fake remote functions', async () => {
        const remoteFunction = fakeRemoteFunction({
            foo: (a, b) => a + b + 5,
        })
        expect(await remoteFunction('foo')(1, 2)).toEqual(8)
    })
})
