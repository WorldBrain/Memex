import db, {
    fetchDocTypesByUrl,
    fetchMetaDocsForPage,
    normaliseFindResult,
} from 'src/pouchdb'
import { delPagesConcurrent, initSingleLookup, keyGen } from 'src/search'
import { pageKeyPrefix, pageDocsSelector } from 'src/page-storage'
import { visitKeyPrefix } from 'src/activity-logger'
import { bookmarkKeyPrefix } from 'src/bookmarks'

export default (input, type = 'url') => {
    switch (type) {
        case 'domain':
            return deleteDomain(input)
        case 'regex':
            return deleteByRegex(input)
        default:
            return deleteSpecificSite(input)
    }
}

/**
 * Removes all matching data from Pouch and search index matching the given regex.
 * Uses `calcMatchingDocs` to determine what to remove.
 *
 * @param {*} regex
 * @returns {Promise<void>}
 */
async function deleteByRegex(regex) {
    const { allRows, pageIds } = await calcMatchingDocs(regex)

    return await Promise.all([deleteDocs(allRows), delPagesConcurrent(pageIds)])
}

/**
 * @param {*} regex
 * @returns {any} Object containing Arrays `allRows` and `pageIds`. `allRows` represents matching Pouch docs.
 *  `pageIds` represents the IDs of just pages (no meta docs).
 */
export async function calcMatchingDocs(regex) {
    // Perform lookup on Pouch pages via matching regex against URL field
    const urlSelector = { url: { $regex: regex } }

    const { rows: pageRows } = normaliseFindResult(
        await db.find({
            selector: { ...pageDocsSelector, ...urlSelector },
            fields: ['_id', '_rev'],
        }),
    )

    // Find all assoc. meta pouch docs to remove
    const allRows = []
    const pageIds = []
    for (const { id } of pageRows) {
        const metaRows = await fetchMetaDocsForPage(id)
        allRows.push(
            ...metaRows.pageRows,
            ...metaRows.visitRows,
            ...metaRows.bookmarkRows,
        )
        pageIds.push(id)
    }

    return { pageIds, allRows }
}

async function deleteDomain(url = '') {
    // Filter-out the `www.`, if there
    const normalizedDomain = url.startsWith('www.') ? url.slice(4) : url

    // Grab domain index entry to get set of pages
    const domainIndex = await initSingleLookup()(
        keyGen.domain(normalizedDomain),
    )
    if (domainIndex == null) {
        return
    }

    // Get all assoc. meta docs for deleting from Pouch
    const allRows = []
    for (const [pageId] of domainIndex) {
        const metaRows = await fetchMetaDocsForPage(pageId)
        allRows.push(
            ...metaRows.pageRows,
            ...metaRows.visitRows,
            ...metaRows.bookmarkRows,
        )
    }

    await Promise.all([
        deleteDocs(allRows),
        delPagesConcurrent([...domainIndex.keys()]),
    ])
}

async function deleteSpecificSite(url = '') {
    const fetchDocsByType = fetchDocTypesByUrl(url)

    const opts = { include_docs: false }
    const { rows: pageRows } = await fetchDocsByType(pageKeyPrefix, opts)
    const { rows: visitRows } = await fetchDocsByType(visitKeyPrefix, opts)
    const { rows: bookmarkRows } = await fetchDocsByType(
        bookmarkKeyPrefix,
        opts,
    )

    const allRows = [...pageRows, ...visitRows, ...bookmarkRows]
    await Promise.all([deleteDocs(allRows), handleIndexDeletes(pageRows)])
}

/**
 * Performs the deletion on PouchDB, deleting all docs passed in.
 */
export const deleteDocs = docs =>
    db.bulkDocs(
        docs.map(row => ({
            _id: row.id,
            _rev: row.value.rev,
            _deleted: true,
        })),
    )

/**
 * Handles updating the index to remove pages and/or the visit timestamp.
 *
 * @param {any} docsToDelete Array of Pouch page rows that will be deleted from the index.
 */
async function handleIndexDeletes(rowsToDelete) {
    const indexDocIds = rowsToDelete.map(row => row.id)

    await delPagesConcurrent(indexDocIds)
}
