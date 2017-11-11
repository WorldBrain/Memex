import get from 'lodash/fp/get'
import fromPairs from 'lodash/fp/fromPairs'
import PouchDB from 'pouchdb-browser'
import PouchDBFind from 'pouchdb-find'
import { blobToBase64String } from 'blob-util'

import { pageKeyPrefix } from 'src/page-storage'
import { visitKeyPrefix } from 'src/activity-logger'
import { bookmarkKeyPrefix } from 'src/bookmarks'
import encodeUrl from 'src/util/encode-url-for-id'

PouchDB.plugin(PouchDBFind)

const pouchdbOptions = {
    name: 'webmemex',
    auto_compaction: true,
}

const db = PouchDB(pouchdbOptions)
export default db

// DEBUG Expose db for debugging or direct user access.
window.db = db

// The couch/pouch way to match keys with a given prefix (e.g. one type of docs).
export const keyRangeForPrefix = prefix => ({
    startkey: `${prefix}`,
    endkey: `${prefix}\uffff`,
})

// Present db.find results in the same structure as other PouchDB results.
export const normaliseFindResult = result => ({
    rows: result.docs.map(doc => ({
        doc,
        id: doc._id,
        key: doc._id,
        value: { rev: doc._rev },
    })),
})

// Get rows of a query result indexed by doc id, as an {id: row} object.
export const resultRowsById = result =>
    fromPairs(result.rows.map(row => [row.id, row]))

/**
 * PouchDB's `.bulkGet` allows us to grab many docs via array of ID at once.
 * Sadly it has a bit of a weird response structure that is hard to use without
 * formatting it first. We only care about the returned docs marked as "ok".
 * More info: https://pouchdb.com/api.html#bulk_get
 *
 * @param {any} bulkGetResponse Standard reponse from PouchDB.bulkGet
 * @returns {Array<any>} Array of "ok"d docs from response.
 */
export const bulkGetResultsToArray = ({ results }) =>
    results
        .map(res => res.docs)
        .map(list => list.filter(doc => doc.ok))
        .filter(list => list.length)
        .map(list => list[0].ok)

// Get an attachment from a doc as a data URL string.
// Pass either a docId or a doc itself, and the attachmentId.
// Returns undefined if non-existent.
export async function getAttachmentAsDataUrl({
    doc,
    docId = doc._id,
    attachmentId,
}) {
    if (
        !docId ||
        !attachmentId ||
        // If we got passed the doc itself, we can check whether the attachment exists.
        (doc && !get(['_attachments', attachmentId, 'digest'])(doc))
    ) {
        return undefined
    }
    let blob
    try {
        blob = await db.getAttachment(docId, attachmentId)
    } catch (err) {
        return undefined
    }
    const base64 = await blobToBase64String(blob)
    const dataUrl = `data:${blob.type};base64,${base64}`
    return dataUrl
}

/**
 * Given a URL, encode it and return a function that affords looking up all matching docs
 * to that URL by specified type prefix. Valid type prefixes look like `page/`.
 *
 * @param {string} url URL to match against docs.
 * @returns {(type: string, opts?: any) => Promise<Array<any>>} Async function that affords searching
 *  on given URL via type. Any extra options to `PouchDB.allDocs` can be passed in as the second arg.
 */
export function fetchDocTypesByUrl(url) {
    const encodedUrl = encodeUrl(url)

    return (typePrefix, opts = { include_docs: true }) =>
        db.allDocs({
            startkey: `${typePrefix}${encodedUrl}`,
            endkey: `${typePrefix}${encodedUrl}\ufff0`,
            ...opts,
        })
}

/**
 * @param {string} pageId Page doc ID to look for associated visit + bookmark docs.
 * @param {any} [opts] Custom `PouchDB.allDocs` options.
 * @returns {any} Object containing `visitDocs` and `bookmarkDocs` arrays of meta docs associated to the input page ID.
 */
export async function fetchMetaDocsForPage(
    pageId,
    opts = { include_docs: false },
) {
    const encodedUrl = pageId.replace(/^page\//, '')

    // Get all assoc. visit doc IDs
    const { rows: visitRows } = await db.allDocs({
        startkey: `${visitKeyPrefix}${encodedUrl}`,
        endkey: `${visitKeyPrefix}${encodedUrl}\ufff0`,
        ...opts,
    })

    // Get all assoc. bookmark doc IDs
    const { rows: bookmarkRows } = await db.allDocs({
        startkey: `${bookmarkKeyPrefix}${encodedUrl}`,
        endkey: `${bookmarkKeyPrefix}${encodedUrl}\ufff0`,
        ...opts,
    })

    // Grab page itself
    const { rows: pageRows } = await db.allDocs({
        startkey: `${pageKeyPrefix}${encodedUrl}`,
        endkey: `${pageKeyPrefix}${encodedUrl}\ufff0`,
        ...opts,
    })

    return { pageRows, visitRows, bookmarkRows }
}
