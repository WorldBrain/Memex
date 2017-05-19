import docuri from 'docuri'

import db from 'src/pouchdb'
import randomString from 'src/util/random-string'
import importsConnectionHandler from './imports-connection-handler'


// Constants
export const lastImportTimeStorageKey = 'last_import_time'
export const installTimeStorageKey = 'extension_install_time'
export const importKeyPrefix = 'import/'
export const importDocsSelector = { _id: { $gte: importKeyPrefix, $lte: `${importKeyPrefix}\uffff` } }


// Imports related utility functions
export const convertImportDocId = docuri.route(`${importKeyPrefix}:timestamp/:nonce`)

export const generateImportDocId = ({
    timestamp = Date.now(),
    nonce = randomString(),
} = {}) => convertImportDocId({ timestamp, nonce })

export const getImportDocs = async () => await db.find({ selector: importDocsSelector })

export const setImportDocStatus = async (docId, status) => {
    const doc = await db.get(docId)
    await db.put({ ...doc, status })
}


// Allow content-script or UI to connect and communicate control of imports
browser.runtime.onConnect.addListener(importsConnectionHandler)
