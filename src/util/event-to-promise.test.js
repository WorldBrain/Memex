/* eslint-env jest */

import pull from 'lodash/pull'

import eventToPromise from './event-to-promise'

class MockEvent {
    constructor() {
        this.listeners = []
    }

    addListener(listener) {
        this.listeners.push(listener)
    }

    removeListener(listener) {
        pull(this.listeners, listener)
    }

    trigger(...args) {
        this.listeners.forEach(listener => listener.apply(null, args))
    }
}

describe('eventToPromise', () => {
    test('should return a promise', () => {
        const promise = eventToPromise({})
        expect(promise).toBeInstanceOf(Promise)
    })

    test('should listen and unlisten to the events', async () => {
        const listeners = new Set()

        // We try both passing multiple events (for resolveOpts) and a single event (for rejectOpts).
        const resolveOpts = [
            { event: new MockEvent() },
            { event: new MockEvent() },
        ]
        const rejectOpts = { event: new MockEvent() }
        eventToPromise(
            {
                resolve: resolveOpts,
                reject: rejectOpts,
            },
            listeners,
        )

        // We use a bogus await statement to let any resolved promises invoke their callbacks.
        // XXX Not sure if we can rely on this in every ES implementation.
        await null
        expect(resolveOpts[0].event.listeners.length).toBe(1)
        expect(resolveOpts[1].event.listeners.length).toBe(1)
        expect(rejectOpts.event.listeners.length).toBe(1)
        expect(listeners.size).toBe(3)

        // Trigger any of the events.
        resolveOpts[1].event.trigger()

        await null
        expect(resolveOpts[0].event.listeners.length).toBe(0)
        expect(resolveOpts[1].event.listeners.length).toBe(0)
        expect(rejectOpts.event.listeners.length).toBe(0)
        expect(listeners.size).toBe(0)
    })

    describe('should resolve with given value when a resolve-event occurs', () => {
        const values = {
            object: { someKey: 'someValue' },
            function: () => ({ someKey: 'someValue' }),
        }
        Object.entries(values).forEach(([type, value]) => {
            test(`when value is a: ${type}`, async () => {
                const resolveOpts = { event: new MockEvent(), value }
                const resolveHandler = jest.fn()
                eventToPromise({
                    resolve: resolveOpts,
                }).then(resolveHandler)

                await null
                expect(resolveHandler).not.toBeCalled()

                resolveOpts.event.trigger()

                await null
                expect(resolveHandler).toBeCalledWith({ someKey: 'someValue' })
            })
        })
    })

    const reasons = {
        string: 'something',
        function: () => 'something else',
        object: { someKey: 'something' },
    }
    describe('should reject with Error(string) if a reject-event occurs', () => {
        Object.entries(reasons).forEach(([type, reason]) => {
            test(`when reason is a: ${type}`, async () => {
                const rejectOpts = {
                    event: new MockEvent(),
                    reason,
                }
                const rejectHandler = jest.fn()
                eventToPromise({
                    reject: rejectOpts,
                }).catch(rejectHandler)

                await null
                expect(rejectHandler).not.toBeCalled()

                rejectOpts.event.trigger()

                await null
                expect(rejectHandler).toBeCalled()
                const error = rejectHandler.mock.calls[0][0]
                expect(error).toBeInstanceOf(Error)
                expect(error.message).toMatch(/.*something.*/)
            })
        })
    })

    test('should apply filter to events', async () => {
        const resolveOpts = {
            event: new MockEvent(),
            filter: jest.fn(),
        }
        const resolveHandler = jest.fn()
        eventToPromise({
            resolve: resolveOpts,
        }).then(resolveHandler)

        await null
        expect(resolveHandler).not.toBeCalled()

        resolveOpts.filter.mockReturnValueOnce(false)
        resolveOpts.event.trigger()

        await null
        expect(resolveHandler).not.toBeCalled()

        resolveOpts.filter.mockReturnValueOnce(true)
        resolveOpts.event.trigger()

        await null
        expect(resolveHandler).toBeCalled()
    })
})
