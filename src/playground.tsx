import {
    setupRpcConnection,
    remoteFunction,
    makeRemotelyCallable,
} from 'src/util/webextensionRPC'
import browser from 'webextension-polyfill'

async function main() {
    const port = browser.runtime.connect(undefined, {
        name: 'options',
    })
    port.onMessage.addListener((msg, sender) => {
        console.log(msg, sender)
    })
}

main()
