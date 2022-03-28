import browser from 'webextension-polyfill'
import { setupRpcConnection } from './util/webextensionRPC'

// we have to register all event listeners (including RPC handlers)
// in the first tick, meaning before awaiting any async functions
function main() {
    setupRpcConnection({ sideName: 'background', role: 'background' })
    // browser.runtime.onMessage.addListener((message) => {
    //   console.log(message)
    // })
}

async function setup() {}

main()
