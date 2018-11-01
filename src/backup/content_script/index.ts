import { remoteFunction } from 'src/util/webextensionRPC'

function sniff() {
    document.addEventListener('DOMContentLoaded', () => {
        const script = document.querySelector('script#user-id')
        if (!script) {
            return
        }

        const userId = script.innerHTML.trim()
        if (userId !== '0') {
            remoteFunction('storeWordpressUserId')
        }
    })
}

if (window.location.hostname === 'worldbrain.io') {
    sniff()
}
