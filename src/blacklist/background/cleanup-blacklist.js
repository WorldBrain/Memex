import db, { normaliseFindResult } from 'src/pouchdb'
import { deleteDocs, handleIndexDeletes } from 'src/page-storage/deletion'

/**
 * Handles cleanup of a blacklisted URL.
 *
 * @param {string} url The URL being blacklisted.
 */
const cleanupBlacklist = url => getURLMatchingDocs({ url })
    .then(result => {
        handleIndexDeletes(result.rows)
        deleteDocs(result.rows)
    })
    .catch(f => f) // Too bad

/**
 * Get all docs with matching URLs.
 *
 * @param {string} {url} Value to use to match against doc URLs.
 */
const getURLMatchingDocs = async ({ url, selector = {} }) => normaliseFindResult(
    await db.find({
        selector: {
            ...selector,
            url: { $regex: url }, // All docs whose URLs contain this value
        },
        fields: ['_id', '_rev'],
    })
)

export default cleanupBlacklist
