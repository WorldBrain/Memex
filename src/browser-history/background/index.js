import initHistoryImport from './import-history'

// Real hacky stuff, as I can't see a clean way to do this yet...
let importer
let importerPort

initHistoryImport({
    onNext: (url, page) => importerPort.postMessage({ type: 'NEXT', url }),
    onError: (url, err) => importerPort.postMessage({ type: 'NEXT', url, err }),
    onCompleted: () => importerPort.postMessage({ type: 'COMPLETE' }),
}).then(res => { importer = res })

/**
 * Given a command from UI, run the matching importer method.
 */
const cmdHandler = ({ cmd }) => {
    switch (cmd) {
        case 'START':
        case 'RESUME': return importer.start()
        case 'STOP': return importer.stop()
        case 'PAUSE': return importer.pause()
        default: return console.error(`unknown command: ${cmd}`)
    }
}

/**
 * Handles importer events from the UI.
 */
browser.runtime.onConnect.addListener(async port => {
    if (port.name !== 'imports') return
    importerPort = port

    console.log('importer connected')

    // Upon connect, send the current vals of the importer to client
    const totals = importer.getInitTotals()
    const fail = importer.getInitFailed()
    const success = importer.getInitSuccess()
    importerPort.postMessage({ type: 'INIT', fail, success, totals })

    importerPort.onMessage.addListener(cmdHandler)
})
