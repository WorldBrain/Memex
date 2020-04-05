import expect from 'expect'

import { ConnectivityCheckerBackground } from '.'

export class MockXHR {
    onload
    onerror

    constructor(
        private props: {
            shouldSucceed: boolean
        },
    ) {}

    open(method: string, url: string, async: boolean) {}

    send() {
        if (this.props.shouldSucceed) {
            this.onload()
        } else {
            this.onerror()
        }
    }

    set shouldSucceed(value: boolean) {
        this.props.shouldSucceed = value
    }
}

function setupTest({ xhr }: { xhr: any }) {
    const background = new ConnectivityCheckerBackground({ xhr, target: '' })

    // Set up spy
    background.emit = eventName =>
        (background['lastEventEmitted'] = eventName) as any

    return { background }
}

describe('ConnectivityCheckerBackground tests', () => {
    it('should emit event and set flag when connected/disconnected', async () => {
        const xhr = new MockXHR({ shouldSucceed: true })
        const { background } = setupTest({ xhr })

        expect(background['lastEventEmitted']).toBeUndefined()

        await background.checkConnection()

        expect(background.isConnected).toBe(true)
        expect(background['lastEventEmitted']).toEqual(
            ConnectivityCheckerBackground.CONNECTED_EVENT,
        )

        // Try again but with a failing XHR
        xhr.shouldSucceed = false

        await background.checkConnection()

        expect(background.isConnected).toBe(false)
        expect(background['lastEventEmitted']).toEqual(
            ConnectivityCheckerBackground.DISCONNECTED_EVENT,
        )
    })

    it('should be able to continually check until connected', async () => {
        const xhr = new MockXHR({ shouldSucceed: false })
        const { background } = setupTest({ xhr })

        const check = background.waitUntilConnected(200)
        xhr.shouldSucceed = true
        await check
        expect(check).resolves.toBeUndefined()
    })
})
