import docuri from 'docuri'

import db from 'src/pouchdb'
import randomString from 'src/util/random-string'
import { pageDocsSelector } from 'src/page-storage'
import { checkWithBlacklist } from 'src/activity-logger'
import { IMPORT_TYPE } from 'src/options/imports/constants'
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
 * @returns A function affording checking of a URL against the URLs of existing page docs.
 */
async function checkWithExistingDocs() {
    const existingFullDocs = { ...pageDocsSelector, isStub: { $ne: true } }
    const { docs: existingPageDocs } = await db.find({ selector: existingFullDocs, fields: ['url'] })
    const existingUrls = existingPageDocs.map(({ url }) => url)

    return ({ url }) => !existingUrls.includes(url)
}

/**
 * Handles performing blacklist and pending import filtering logic on any type
 * of items containing a `url` field.
 *
 * @param {Iterable<any>} items Some Iterable of items of any shape, as long as they contain `url` field.
 * @returns {Iterable<any>} Filtered version of the items arg.
 */
async function filterItemsByUrl(items, type) {
    const isNotBlacklisted = await checkWithBlacklist()
    const doesNotExist = await checkWithExistingDocs()

    const isWorthRemembering = item => isNotBlacklisted(item) && doesNotExist(item)
    return items.filter(isWorthRemembering)
}

/**
 * @param {number} [maxResults=9999999] The max amount of items to grab from browser.
 * @param {number} [startTime=0] The time to start search from for browser history.
 * @returns {Array<browser.history.HistoryItem>} All history items in browser filtered by URL.
 */
export async function getURLFilteredHistoryItems(maxResults = 9999999, startTime = 0) {
    const historyItems = await browser.history.search({ text: '', maxResults, startTime })
    return filterItemsByUrl(historyItems, IMPORT_TYPE.HISTORY)
}

/**
 * @param {number} [maxResults=100000] The max amount of items to grab from browser.
 * @returns {Array<browser.bookmarks.BookmarkTreeNode>} All bookmark items in browser filtered by URL.
 */
export async function getURLFilteredBookmarkItems(maxResults = 100000) {
    const bookmarkItems = await browser.bookmarks.getRecent(maxResults)
    return filterItemsByUrl(bookmarkItems, IMPORT_TYPE.BOOKMARK)
}

// Allow content-script or UI to connect and communicate control of imports
browser.runtime.onConnect.addListener(importsConnectionHandler)
