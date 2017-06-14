import docuri from 'docuri'

import db from 'src/pouchdb'
import randomString from 'src/util/random-string'
import { pageDocsSelector } from 'src/page-storage'
import importsConnectionHandler from './imports-connection-handler'


// Constants
export const importProgressStorageKey = 'is_import_in_progress'
export const importStateStorageKey = 'import_items'
export const installTimeStorageKey = 'extension_install_time'
export const bookmarkKeyPrefix = 'bookmark/'
export const bookmarkDocsSelector = { _id: { $gte: bookmarkKeyPrefix, $lte: `${bookmarkKeyPrefix}\uffff` } }

// Bookmarks related utility functions (TODO: Find appropriate space for this to live)
export const convertBookmarkDocId = docuri.route(`${bookmarkKeyPrefix}:timestamp/:nonce`)

export const generateBookmarkDocId = ({
    timestamp = Date.now(),
    nonce = randomString(),
} = {}) => convertBookmarkDocId({ timestamp, nonce })

// Imports local storage state interface
export const getImportItems = async () => {
    const data = (await browser.storage.local.get(importStateStorageKey))[importStateStorageKey]
    return !data ? [] : JSON.parse(data)
}

export const setImportItems = items =>
    browser.storage.local.set({ [importStateStorageKey]: JSON.stringify(items) })

export const clearImportItems = () =>
    browser.storage.local.remove(importStateStorageKey)

/**
 * @param url The URL to match against all items in import state. Item with matching URL will be removed.
 *  Assumes that input state is unique on URL to work properly.
 */
export const removeImportItem = async url => {
    const importItems = await getImportItems()
    const i = importItems.findIndex(item => item.url === url)
    if (i !== -1) {
        await setImportItems([
            ...importItems.slice(0, i),
            ...importItems.slice(i + 1),
        ])
    }
}

/**
 * Removes all existing page docs in pouch that have `isStub` field set to `true`.
 * Currently this field is only used in the context of imports, however this fn may change
 * if the field is used elsewhere later, or it will remove unwanted page doc stubs.
 */
export const removeAllImportPageStubs = async () => {
    const { docs } = await db.find({ selector: { ...pageDocsSelector, isStub: true } })
    await Promise.all(docs.map(doc => db.remove(doc)))
}

// Allow content-script or UI to connect and communicate control of imports
browser.runtime.onConnect.addListener(importsConnectionHandler)
