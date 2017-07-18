import db, { normaliseFindResult } from 'src/pouchdb'
import { deleteDocs } from 'src/page-storage/deletion'
import { addToBlacklist } from '..'

/**
 * Handles confirmation and running of a quick blacklist request from the popup script.
 *
 * @param {string} url The URL being blacklisted.
 */
export default async function quickBlacklistConfirm(url) {
    const { rows } = await getURLMatchingDocs({ url })

    if (window.confirm(`Do you want to delete ${rows.length} matching records to ${url}?`)) {
        deleteDocs(rows)
    }

    addToBlacklist(url)
}

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
