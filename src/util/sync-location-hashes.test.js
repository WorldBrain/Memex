/* eslint-env jest */

import syncLocationHashes from './sync-location-hashes'

const createWindowMock = () => {
    const win = {
        location: { _hash: '' },
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
    }
    Object.defineProperty(win.location, 'hash', {
        // Store the hash without '#' in the _hash attribute, and prefix the '#' when getting it.
        get: jest.fn(function() {
            return this._hash ? `#${this._hash}` : ''
        }),
        set: jest.fn(function(value) {
            this._hash = value.replace(/^#/, '')
        }),
    })
    return win
}

describe('windowMock', () => {
    test('should prepend the # to the hash value', () => {
        const win = createWindowMock()
        win.location.hash = 'abc'
        expect(win.location.hash).toEqual('#abc')
    })

    test('should not end up with a double ## before the hash value', () => {
        const win = createWindowMock()
        win.location.hash = '#abc'
        expect(win.location.hash).toEqual('#abc')
    })

    test('should not add a # when the hash is the empty string', () => {
        const win = createWindowMock()
        win.location.hash = ''
        expect(win.location.hash).toEqual('')
    })
})

describe('syncLocationHashes', () => {
    const win1 = createWindowMock()
    const win2 = createWindowMock()
    const win3 = createWindowMock()
    const windows = [win1, win2, win3]

    beforeEach(() => {
        win1.location.hash = '#win1hash'
        win2.location.hash = '#win2hash'
        win3.location.hash = '#win3hash'
        windows.forEach(win => {
            win.addEventListener.mockReset()
            win.removeEventListener.mockReset()
            // Do not reset getter/setter implementations, but clear their call log.
            // (note that the _hash value is left intact, to the value we just gave it)
            const { get, set } = Object.getOwnPropertyDescriptor(
                win.location,
                'hash',
            )
            get.mockClear()
            set.mockClear()
        })
    })

    test('should create a listener on the windows', () => {
        syncLocationHashes(windows)
        windows.forEach(win => {
            expect(win.addEventListener).toHaveBeenCalledTimes(1)
        })
    })

    test('should disable the listeners when returned function is called', () => {
        const disableListener = syncLocationHashes(windows)
        windows.forEach(win => {
            expect(win.removeEventListener).not.toHaveBeenCalled()
        })

        disableListener()

        windows.forEach(win => {
            expect(win.removeEventListener.mock.calls).toEqual(
                win.addEventListener.mock.calls,
            )
        })
    })

    test('should directly perform an initial sync if specified', () => {
        win2.location.hash = '#somehash'
        syncLocationHashes(windows, { initial: win2 })

        windows.forEach(win => {
            expect(win.location.hash).toEqual('#somehash')
        })
    })

    test('should sync to other windows when one emits a hashchange event', () => {
        syncLocationHashes(windows)
        const win2HashChangeEventListener =
            win2.addEventListener.mock.calls[0][1]

        win2.location.hash = '#newhash'
        win2HashChangeEventListener()

        windows.forEach(win => {
            expect(win.location.hash).toEqual('#newhash')
        })
    })

    test('should avoid creating an infinite updating loop', () => {
        // We simply verify that a hash will not be set if it already has the right value.
        syncLocationHashes(windows)
        const win2HashChangeEventListener =
            win2.addEventListener.mock.calls[0][1]

        win1.location.hash = '#samehash'
        win2.location.hash = '#samehash'
        win3.location.hash = '#samehash'
        win2HashChangeEventListener()

        windows.forEach(win => {
            const hashSetter = Object.getOwnPropertyDescriptor(
                win.location,
                'hash',
            ).set
            expect(hashSetter).toHaveBeenCalledTimes(1) // just our manual assignment above.
        })
    })
})
