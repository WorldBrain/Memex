import db, { fetchDocTypesByUrl } from 'src/pouchdb'
import { deleteDocs, handleIndexDeletes } from 'src/page-storage/deletion'
import { pageKeyPrefix } from 'src/page-storage'
import { visitKeyPrefix } from 'src/activity-logger'
import { bookmarkKeyPrefix } from 'src/imports'

/**
 * Handles cleanup of a blacklisted URL by deleting all related docs from Pouch + index.
 *
 * @param {string} url The URL being blacklisted.
 */
const cleanupBlacklist = url => fetchURLMatchingRows(url)
    .then(rows => {
        handleIndexDeletes(rows)
        deleteDocs(rows)
    })
    .catch(f => f) // Too bad


/**
 * Get all docs of all types with matching URLs. Performs a log-time lookup for each doc type.
 *
 * @param {string} {url} Value to use to match against doc URLs.
 * @param {any} {opts} Custom options to pass to `PouchDB.allDocs()`.
 * @return {Array<any>} Array of doc rows with URLs matching `url` arg.
 */
export async function fetchURLMatchingRows(url, opts = { include_docs: false }) {
    const fetchDocsByType = fetchDocTypesByUrl(url)

    const { rows: pageRows } = await fetchDocsByType(pageKeyPrefix, opts)
    const { rows: visitRows } = await fetchDocsByType(visitKeyPrefix, opts)
    const { rows: bookmarkRows } = await fetchDocsByType(bookmarkKeyPrefix, opts)

    return [...pageRows, ...visitRows, ...bookmarkRows]
}

export default cleanupBlacklist
