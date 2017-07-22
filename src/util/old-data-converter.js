import uniqBy from 'lodash/fp/uniqBy'
import chunk from 'lodash/fp/chunk'
import flatten from 'lodash/fp/flatten'
import omit from 'lodash/fp/omit'

import db from 'src/pouchdb'
import { STORAGE_KEY as NEW_BLACKLIST_KEY } from 'src/options/blacklist/constants'
import { generatePageDocId, pageDocsSelector } from 'src/page-storage'
import { generateVisitDocId } from 'src/activity-logger'
// TODO: unify these after refactored to be somewhere more appropriate
import { transformToVisitDoc } from 'src/imports/background/imports-preparation'
import { generateBookmarkDocId } from 'src/imports/background'

export const dedupIdxName = 'conversion-dedupe-index'
const dedupQueryFields = ['url', '_id']

/** Misc keys from old extension that are no longer used */
const MISC_KEYS = [
    'import_fail_progress_state', 'import_success_progress_state',
    'import_totals_state', 'import_progress', 'shouldOpenTab',
]

export const KEYS = {
    INDEX: 'index',
    BOOKMARKS: 'bookmarks',
    HIST: 'history',
    PREFS: 'preferences',
    BLACKLIST: 'blacklist',
}

const notifOptions = {
    type: 'progress',
    progress: 0,
    iconUrl: '/img/worldbrain-logo-narrow.png',
    title: 'WorldBrain Update',
    message: 'Converting existing extension data for update. Please wait',
}

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
const transformToMinimalVisit = assocPageDoc => ({ time, url }) => ({
    _id: generateVisitDocId({ timestamp: time }),
    visitStart: time,
    url,
    page: { _id: assocPageDoc._id },
})

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
 * @param {IPageDoc?} [assocPageDoc] A page doc found to match the pageData param.
 * @return {Array<any>} List of converted docs ready to insert into PouchDB.
 */
const convertPageData = (isStub, bookmarkUrls) => assocPageDoc => async pageData => {
    // Do page conversion + visits generation
    const pageDoc = assocPageDoc || transformToPageDoc(isStub)(pageData)
    const visitItems = await browser.history.getVisits({ url: pageData.url })
    const visitDocs = [
        ...visitItems.map(transformToVisitDoc(pageDoc)), // Visits from browser API
        transformToMinimalVisit(pageDoc)(pageData), // Minimal visit straight from old ext data
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
 * @param {IPageOldExt} pageData Page data to check against existing data for matches.
 * @return {IPageDoc|undefined} Page doc that are deemed to match any of the input data or undefined.
 */
const getMatchingPageDocs = async ({ url }) => {
    const selector = { ...pageDocsSelector, url }
    const { docs } = await db.find({ selector, fields: dedupQueryFields })
    return docs[0]
}

const deleteDedupIndex = async () => {
    const { indexes } = await db.getIndexes()
    const dedupIndex = indexes.findIndex(({ name }) => name === dedupIdxName)

    if (dedupIndex === -1) throw new Error('Conversion deduping index not found')

    await db.deleteIndex(indexes[dedupIndex])
}

/**
 * @param {IBlacklistOldExt} blacklist
 */
const handleBlacklistConversion = async blacklist => {
    const converted = convertBlacklist(blacklist)
    await browser.storage.local.set({ [NEW_BLACKLIST_KEY]: converted })

    if (NEW_BLACKLIST_KEY !== KEYS.BLACKLIST) { // Don't accidently remove what we just stored
        await browser.storage.local.remove(KEYS.BLACKLIST)
    }
}

/**
 * Performs the conversion of old extension page data to new extension. For each page data
 * in the old model, the following may be inserted into PouchDB:
 *  - 0/1 page docs (0 if processed earlier in index)
 *  - 0/1 bookmark docs (if present in `bookmarkUrls` param)
 *  - 1+ visit docs (1 minimal from old page data + whatever in in the browser history)
 *
 * @param {Array<string>} index The old extension index, containing sorted keys of page data.
 * @param {Array<string>} bookmarkUrls The old extension bookmark tracking list, containing URLs.
 * @param {(number) => void} updateProgress Callback to update progress state elsewhere.
 * @param {ConversionOpts} opts
 */
async function handlePageDataConversion(index, bookmarkUrls, updateProgress, { setAsStubs, concurrency }) {
    const convertOldPageData = convertPageData(setAsStubs, bookmarkUrls)
    const uniqByUrl = uniqBy('url')
    let hasErrorOccurred = false
    let chunkCount = 0

    // Split index into chunks to process at once; reverse to process from latest first
    const indexChunks = chunk(concurrency)(index.reverse())

    // Create deduping index for deduping during conversion
    await db.createIndex({ index: { name: dedupIdxName, fields: dedupQueryFields } })

    for (const keyChunk of indexChunks) {
        try {
            // Grab old page data from storae, ignoring duplicate URLs
            const oldPageData = uniqByUrl(Object.values(await browser.storage.local.get(keyChunk)))

            // Map over local storage chunk, async processing each page data entry
            const matchingPageDoc = await getMatchingPageDocs(oldPageData) // Use existing page doc, if available
            const docs = await Promise.all(oldPageData.map(convertOldPageData(matchingPageDoc)))

            // Bulk insert all docs for this chunk
            await db.bulkDocs(flatten(docs))

            // Clean up this chunk from local storage
            await browser.storage.local.remove(keyChunk)
        } catch (error) {
            hasErrorOccurred = true
            console.error(`DEBUG: Error in converting of old extension data with keys: ${keyChunk}`)
            console.error(error)
            continue    // Continue processing next chunk if this one failed
        } finally {
            updateProgress(Math.round(++chunkCount / indexChunks.length * 100))
        }
    }

    deleteDedupIndex() // Clean up index, but don't wait

    if (!hasErrorOccurred) { // Clean other old ext data up if no problem happened
        const pageRelatedKeys = omit('BLACKLIST')(KEYS)
        browser.storage.local.remove([...Object.values(pageRelatedKeys), ...MISC_KEYS])
    }
}

/**
 * @typedef ConversionOpts
 * @type {Object}
 * @property {boolean} [setAsStubs=false] Denotes whether to set new pages as stubs to schedule for later import.
 * @property {number} [concurrency=10] The amount of index items to process at any time.
 */

/**
 * Converts the old extension's local storage object into one compatible with the new extension's
 * storage models, placing resulting conversions into either PouchDB or local storage, depending on the
 * data converted.
 * @param {ConversionOpts} opts
 */
export default async function convertOldData(opts = { setAsStubs: false, concurrency: 10 }) {
    const notifId = await browser.notifications.create(notifOptions)
    const updateProgress = progress => browser.notifications.update(notifId, { progress })

    // Grab initial needed local storage keys, providing defaults if not available
    const {
        [KEYS.INDEX]: index,
        [KEYS.BLACKLIST]: blacklist,
        [KEYS.BOOKMARKS]: bookmarks,
    } = await browser.storage.local.get({
            [KEYS.INDEX]: { index: [] },
            [KEYS.BLACKLIST]: { PAGE: [], SITE: [], REGEX: [] },
            [KEYS.BOOKMARKS]: '[]',
        })

    // Only attempt blacklist conversion if it matches shape of old extension blacklist
    if (Object.prototype.toString.call(blacklist) === '[object Object]'
        && 'PAGE' in blacklist && 'SITE' in blacklist && 'REGEX' in blacklist) {
        await handleBlacklistConversion(blacklist)
    }

    // Only attempt page data conversion if index + bookmark storage values are correct types
    if (index && index.index instanceof Array && typeof bookmarks === 'string') {
        let bookmarkUrls
        try {
            bookmarkUrls = JSON.parse(bookmarks).map(entry => entry.url)
        } catch (error) {
            // Bookmarks data cannot be parsed; means assumed shape is not there, possibly from user modification
            bookmarkUrls = []
        } finally {
            await handlePageDataConversion(index.index, bookmarkUrls, updateProgress, opts)
        }
    }

    updateProgress(100)
    setTimeout(() => browser.notifications.clear(notifId), 3000)
}
