import db from 'src/pouchdb'
import { FREEZE_DRY_BOOKMARKS_KEY } from 'src/options/preferences/constants'
import { pageDocsSelector } from './'

const freezeDryAttachmentId = 'frozen-page.html'

const getQuery = ({ skipBookmarkPages = false, skip = 100, customFields = [] }) => {
    // TODO: Replace this with actual bookmarks flag on page docs from bookmark creation event
    const bookmarksFlagSelector = skipBookmarkPages ? { isBookmarkPage: { $ne: true } } : {}

    return {
        selector: {
            ...pageDocsSelector,
            keepFreezeDry: { $ne: true },
            ...bookmarksFlagSelector,
        },
        skip,
        sort: [{ _id: 'desc' }],
        fields: ['_id', '_rev', ...customFields],
    }
}

/**
 * Handle removal of freeze-dry attachments from page docs that match the following criteria:
 *  - not in the 100 latest page docs
 *  - not manually specified by user to keep (`keepFreezeDry` flag)
 *  - not associated with created bookmark doc (if user-option set)
 */
export default async function cleanupFreezeDry() {
    const skipBookmarkPages = (await browser.storage.local.get(FREEZE_DRY_BOOKMARKS_KEY))[FREEZE_DRY_BOOKMARKS_KEY]

    const { docs } = await db.find(getQuery({ skipBookmarkPages, customFields: ['_attachments'] }))

    // Remove freeze dry attachment from docs if present
    for (const doc of docs) {
        // TODO: replace this check with $exists in query
        if (doc._attachments && doc._attachments[freezeDryAttachmentId]) {
            await db.removeAttachment(doc._id, freezeDryAttachmentId, doc._rev)
        }
    }
}
