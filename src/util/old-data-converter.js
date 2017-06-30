import docuri from 'docuri'
import uniqBy from 'lodash/fp/uniqBy'
import chunk from 'lodash/fp/chunk'
import map from 'lodash/fp/map'
import flatten from 'lodash/fp/flatten'

import db from 'src/pouchdb'
import randomString from 'src/util/random-string'
import { generatePageDocId } from 'src/page-storage'
import { generateVisitDocId } from 'src/activity-logger'
import { STORAGE_KEY as BLACKLIST_KEY } from 'src/options/blacklist/constants'

export const INDEX_KEY = 'index'
export const BOOKMARKS_KEY = 'bookmarks'

/**
 * @typedef IBlacklistOldExt
 * @type {Object}
 * @property {Array<String>} PAGE An array of blocked pages (UNUSED).
 * @property {Array<String>} SITE An array of blocked sites (UNUSED).
 * @property {Array<String>} REGEX An array of strings to use to match sites.
 */

/**
 * @typedef IPageOldExt
 * @type {Object}
 * @property {String} text The extracted page text.
 * @property {String} time The time the page data was stored.
 * @property {String} title The page title.
 * @property {String} url The URL pointing to the page.
 */

/**
 * @param {IPageOldExt} pageData Page data from old extension to convert to visit doc.
 * @param {string} assocPageDocId The `_id` of the associated page doc.
 */
const convertToMinimalVisit = assocPageDoc => ({ time, url }) => ({
    _id: generateVisitDocId({ timestamp: time }),
    visitStart: time,
    url,
    page: { _id: assocPageDoc._id },
})

// TODO: Merge with imports code
const transformToVisitDoc = assocPageDoc => visitItem => ({
    _id: generateVisitDocId({
        timestamp: visitItem.visitTime,
        // We set the nonce manually, to prevent duplicating items if
        // importing multiple times (thus making importHistory idempotent).
        nonce: visitItem.visitId,
    }),
    visitStart: visitItem.visitTime,
    referringVisitItemId: visitItem.referringVisitId,
    url: assocPageDoc.url,
    page: { _id: assocPageDoc._id },
})

// TODO: Merge with imports code
const bookmarkKeyPrefix = 'bookmark/'
const convertBookmarkDocId = docuri.route(`${bookmarkKeyPrefix}:timestamp/:nonce`)
const generateBookmarkDocId = ({
    timestamp = Date.now(),
    nonce = randomString(),
} = {}) => convertBookmarkDocId({ timestamp, nonce })

/**
 * @param {IPageOldExt} oldPage
 * @return {IPageDoc} The converted minimal page doc.
 */
const transformToPageDoc = isStub => ({ text, time, title, url }) => ({
    _id: generatePageDocId({ timestamp: time }),
    title,
    url,
    isStub,
    content: {
        fullText: text,
        title,
    },
})

/**
 * @param {IPageDoc} assocPageDoc The page doc with which to associate this bookmark doc.
 * @param {IPageOldExt} oldPage
 * @return {IBookmarkDoc} The converted minimal bookmark doc.
 */
const transformToBookmarkDoc = assocPageDoc => ({ text, time, title, url }) => ({
    _id: generateBookmarkDocId({ timestamp: time }),
    title,
    url,
    page: { _id: assocPageDoc._id },
})

const transformToBlacklistEntry = dateAdded => expression => ({ expression, dateAdded })

/**
 * @param {IBlacklistOldExt} blacklist The old extension-formatted blacklist.
 * @return {String} The new extension serialized array of `{ expression: String, dateAdded: Date }` elements.
 */
function convertBlacklist(blacklist) {
    const mapToNewModel = transformToBlacklistEntry(Date.now())
    const uniqByExpression = uniqBy('expression')

    // Map all old values to enries in new model; uniq them on 'expression'
    const blacklistArr = uniqByExpression([
        ...blacklist.PAGE.map(mapToNewModel),
        ...blacklist.SITE.map(mapToNewModel),
        ...blacklist.REGEX.map(mapToNewModel),
    ])

    return JSON.stringify(blacklistArr) // Serialize it, as stored in new model
}

/**
 * Given old page data, attemps to convert it to the new model and generate any visit docs that can be
 * found in the browser along with a bookmark doc if needed.
 *
 * @param {boolean} isStub Denotes whether to set new pages as stubs to schedule for later import.
 * @param {Array<String>} bookmarkUrls List of URLs denoting bookmark page data.
 * @param {IPageOldExt} pageData The old ext model's page data to convert.
 * @return {Array<any>} List of converted docs ready to insert into PouchDB.
 */
const convertPage = (isStub, bookmarkUrls) => async pageData => {
    // Do page conversion + visits generation
    const pageDoc = transformToPageDoc(isStub)(pageData)
    const visitItems = await browser.history.getVisits({ url: pageData.url })
    const visitDocs = [
        ...visitItems.map(transformToVisitDoc(pageDoc)), // Visits from browser API
        convertToMinimalVisit(pageDoc)(pageData), // Minimal visit straight from old ext data
    ]

    // Create bookmark doc if URL shows up in bookmark URL list
    const bookmarkDocs = bookmarkUrls.includes(pageData.url) ? [transformToBookmarkDoc(pageDoc)(pageData)] : []

    return [
        pageDoc,
        ...visitDocs,
        ...bookmarkDocs,
    ]
}

/**
 * Converts the old extension's local storage object into one compatible with the new extension's
 * storage models, placing resulting conversions into either PouchDB or local storage, depending on the
 * data converted.
 *
 * @param {boolean} [setAsStubs=false] Denotes whether to set new pages as stubs to schedule for later import.
 * @param {number} [chunkSize=10] The amount of index items to process at any time.
 */
export default async function convertOldData(setAsStubs = false, chunkSize = 10) {
    // Grab initial needed local storage keys, providing defaults if not available
    const {
        [INDEX_KEY]: index,
        [BLACKLIST_KEY]: blacklist,
        [BOOKMARKS_KEY]: bookmarkUrls,
    } = await browser.storage.local.get({
        [INDEX_KEY]: [],
        [BLACKLIST_KEY]: { PAGE: [], SITE: [], REGEX: [] },
        [BOOKMARKS_KEY]: [],
    })

    // TODO: Check the shape of the blacklist in storage conforms to old shape
    // Do blacklist conversion (relatively simple)
    const newBlacklist = convertBlacklist(blacklist)
    await browser.storage.local.set({ [BLACKLIST_KEY]: newBlacklist })

    const mapPageConversion = map(convertPage(setAsStubs, bookmarkUrls))
    const indexChunks = chunk(chunkSize)(index) // Split index into chunks to process at once

    for (const keyChunk of indexChunks) {
        try {
            const oldPageData = await browser.storage.local.get(keyChunk)

            // Map over local storage chunk, async processing each page data entry
            const docs = await Promise.all(mapPageConversion(oldPageData))

            // Bulk insert all docs for this chunk
            await db.bulkDocs(flatten(docs))
        } catch (error) {
            console.error('DEBUG: Error encountered in storage conversion:')
            console.error(error)
            continue    // Continue processing next chunk if this one failed
        }
    }
}
