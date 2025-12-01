import { runInBackground } from 'src/util/webextensionRPC'

async function main() {
    console.log(1)
    await runInBackground<{
        testCallable: () => Promise<void>
    }>().testCallable()
    console.log(2)
    // const port = chrome.runtime.connect(undefined, {
    //     name: 'options',
    // })
    // port.onMessage.addListener((msg, sender) => {
    //     console.log(msg, sender)
    // })
}

main()

// window.runInBackground = runInBackground
