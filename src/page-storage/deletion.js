import db, { fetchDocTypesByUrl, fetchMetaDocsForPage } from 'src/pouchdb'
import { delPagesConcurrent, initSingleLookup, keyGen } from 'src/search'
import { pageKeyPrefix } from 'src/page-storage'
import { visitKeyPrefix } from 'src/activity-logger'
import { bookmarkKeyPrefix } from 'src/bookmarks'

export default (url, domainDelete = false) =>
    domainDelete ? deleteDomain(url) : deleteSpecificSite(url)

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
