import db, { fetchDocTypesByUrl } from 'src/pouchdb'
import { del } from 'src/search'
import { pageKeyPrefix } from 'src/page-storage'
import { visitKeyPrefix } from 'src/activity-logger'
import { bookmarkKeyPrefix } from 'src/bookmarks'

export default async function deleteDocsByUrl(url) {
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

    await del(indexDocIds)
}
