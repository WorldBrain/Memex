import db from 'src/pouchdb'
import { FREEZE_DRY_BOOKMARKS_KEY } from 'src/options/preferences/constants'
import { pageDocsSelector } from 'src/page-storage'

const freezeDryAttachmentId = 'frozen-page.html'

const getQuery = (skipBookmarkPages = false, customFields = []) => {
    // TODO: Replace this with actual bookmarks flag on page docs from bookmark creation event
    const bookmarksFlagSelector = skipBookmarkPages ? { isBookmarkPage: { $ne: true } } : {}

    return {
        selector: {
            ...pageDocsSelector,
            keepFreezeDry: { $ne: true },
            isStub: { $ne: true },
            ...bookmarksFlagSelector,
        },
        fields: ['_id', '_rev', ...customFields],
    }
}

/**
 * Handle removal of freeze-dry attachments from page docs that match the following criteria:
 *  - not in the 100 latest page docs
 *  - not manually specified by user to keep (`keepFreezeDry` flag)
 *  - not associated with created bookmark doc (if user-option set)
 * @param {number} [keepLimit=100] The number of recent page freeze-dries to keep
 */
const cleanupFreezeDry = (keepLimit = 100) => async () => {
    const skipBookmarkPages = (await browser.storage.local.get(FREEZE_DRY_BOOKMARKS_KEY))[FREEZE_DRY_BOOKMARKS_KEY]

    const { docs } = await db.find(getQuery(skipBookmarkPages, ['_attachments']))
    let numProcessed = 0

    // Remove freeze dry attachment from docs if present (start from latest)
    for (const doc of docs.reverse()) {
        // TODO: replace this check with $exists in query
        if (doc._attachments && doc._attachments[freezeDryAttachmentId] && numProcessed++ > keepLimit) {
            await db.removeAttachment(doc._id, freezeDryAttachmentId, doc._rev)
        }
    }
}

export default cleanupFreezeDry
