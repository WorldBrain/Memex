import importHistory, { importDocsSelector } from './import-history'
import batcher from 'src/util/promise-batcher'
import { fetchAndAnalysePage } from 'src/page-storage/store-page'
import db from 'src/pouchdb'

const getImportDocs = async () => await db.find({ selector: importDocsSelector })

const genericCount = { history: 0, bookmark: 0 }
const initCounts = { totals: genericCount, fail: genericCount, success: genericCount }
const getImportCounts = docs => docs.reduce((acc, doc) => ({
    totals: { ...acc.totals, [doc.type]: acc.totals[doc.type] + 1 },
    fail: { ...acc.fail, [doc.type]: acc.fail[doc.type] + (doc.status === 'fail' ? 1 : 0) },
    success: { ...acc.success, [doc.type]: acc.success[doc.type] + (doc.status === 'success' ? 1 : 0) },
}), initCounts)

/**
 * Handles importer events from the UI.
 */
browser.runtime.onConnect.addListener(async port => {
    if (port.name !== 'imports') return

    console.log('importer connected')
    await importHistory({})

    // Get import counts and send them down to UI
    const { docs: importDocs } = await getImportDocs()
    port.postMessage({ type: 'INIT', ...getImportCounts(importDocs) })

    port.onMessage.addListener(({ cmd }) => {
        switch (cmd) {
            case 'START':
            case 'RESUME':
            case 'STOP':
            case 'PAUSE':
            default: return console.error(`unknown command: ${cmd}`)
        }
    })
})
