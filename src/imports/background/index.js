import docuri from 'docuri'

import db from 'src/pouchdb'
import randomString from 'src/util/random-string'
import importsConnectionHandler from './imports-connection-handler'


// Constants
export const lastImportTimeStorageKey = 'last_import_time'
export const importProgressStorageKey = 'is_import_in_progress'
export const installTimeStorageKey = 'extension_install_time'
export const bookmarkKeyPrefix = 'bookmark/'
export const bookmarkDocsSelector = { _id: { $gte: bookmarkKeyPrefix, $lte: `${bookmarkKeyPrefix}\uffff` } }
export const importKeyPrefix = 'import/'
export const importDocsSelector = { _id: { $gte: importKeyPrefix, $lte: `${importKeyPrefix}\uffff` } }

// Bookmarks related utility functions (TODO: Find appropriate space for this to live)
export const convertBookmarkDocId = docuri.route(`${bookmarkKeyPrefix}:timestamp/:nonce`)

export const generateBookmarkDocId = ({
    timestamp = Date.now(),
    nonce = randomString(),
} = {}) => convertBookmarkDocId({ timestamp, nonce })

// Imports related utility functions
export const convertImportDocId = docuri.route(`${importKeyPrefix}:timestamp/:nonce`)

export const generateImportDocId = ({
    timestamp = Date.now(),
    nonce = randomString(),
} = {}) => convertImportDocId({ timestamp, nonce })

export const getImportDocs = async (query = {}, fields = []) => await db.find({
    selector: {
        ...importDocsSelector,
        ...query,
    },
    fields,
})

export const setImportDocStatus = async (docId, status) => {
    const doc = await db.get(docId)
    await db.put({ ...doc, status })
}


// Allow content-script or UI to connect and communicate control of imports
browser.runtime.onConnect.addListener(importsConnectionHandler)
