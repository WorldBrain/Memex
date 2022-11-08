import { remoteFunction } from '../../util/webextensionRPC'

let timerId

const isDOMContentLoaded = () =>
    new Promise<void>((resolve) => {
        timerId = setInterval(() => {
            if (document.readyState === 'complete') {
                clearInterval(timerId)
                resolve()
            }
        }, 50)
    })

export async function sniffWordpressWorldbrainUser() {
    await isDOMContentLoaded()

    const script = document.querySelector('script#user-id')
    if (!script) {
        return
    }

    const userId = script.innerHTML.trim()
    if (userId !== '0') {
        remoteFunction('storeWordpressUserId')(userId)
    }

    if (globalThis.location.pathname === '/order-received/thank-you/') {
        setTimeout(() => {
            globalThis.location.href =
                globalThis.location.pathname + 'redirect/'
        }, 1000 * 5)
    }
}
