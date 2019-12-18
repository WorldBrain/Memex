import { remoteFunction } from '../../util/webextensionRPC'

let timerId

const isDOMContentLoaded = () =>
    new Promise<void>(resolve => {
        timerId = setInterval(() => {
            if (document.readyState === 'complete') {
                clearInterval(timerId)
                resolve()
            }
        }, 50)
    })

async function sniff() {
    await isDOMContentLoaded()

    const script = document.querySelector('script#user-id')
    if (!script) {
        return
    }

    const userId = script.innerHTML.trim()
    if (userId !== '0') {
        remoteFunction('storeWordpressUserId')(userId)
    }

    if (window.location.pathname === '/order-received/thank-you/') {
        setTimeout(() => {
            window.location.href = window.location.pathname + 'redirect/'
        }, 1000 * 5)
    }
}

if (window.location.hostname === 'worldbrain.io') {
    sniff()
}
