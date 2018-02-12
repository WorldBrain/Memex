/* eslint-env jest */

import delay from './delay'

jest.useFakeTimers()

describe('delay', () => {
    test('should set a timer with the given delay', () => {
        delay(1000)
        expect(setTimeout.mock.calls.length).toBe(1)
        expect(setTimeout.mock.calls[0][1]).toBe(1000)
    })

    test('should return a promise which resolves after the timer finishes', async () => {
        const assertFunc = jest.fn()
        delay(1000)
            .then(assertFunc)
            .catch(err => {})

        await null
        expect(assertFunc).not.toHaveBeenCalled()

        jest.runAllTimers()

        await null
        expect(assertFunc).toHaveBeenCalled()
    })
})
