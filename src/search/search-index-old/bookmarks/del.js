import { fetchDocTypesByUrl } from 'src/pouchdb'
import { generatePageDocId } from 'src/page-storage'
import { index, initSingleLookup } from '../'
import deleteDocsByUrl, { deleteDocs } from 'src/page-storage/deletion'
import { bookmarkKeyPrefix } from '../../bookmarks'

/**
 * TODO: Decided if we actually need these bookmark docs in Pouch; I don't think they're being used for anything.
 *
 * @param {string} url URL to remove _all_ bookmarks for.
 * @throws {Error} Error thrown when `pageId` param does not correspond to existing document (or any other
 *  standard indexing-related Error encountered during updates).
 * @returns {Promise<void>}
 */
async function removeBookmarkByUrl(url) {
    const pageId = generatePageDocId({ url })
    const reverseIndexDoc = await initSingleLookup()(pageId)

    if (reverseIndexDoc == null) {
        throw new Error(
            `No document exists in reverse page index for the supplied page ID: ${pageId}`,
        )
    }

    // If no visits, we don't want an orphaned page, so remove everything for given URL
    if (!reverseIndexDoc.visits.size) {
        await deleteDocsByUrl(url)
    } else {
        // Standard case where only bookmarks removed from index

        // Deindex from bookmarks index
        await index.del([...reverseIndexDoc.bookmarks.values()])

        // Update reverse index bookmarks for current doc
        reverseIndexDoc.bookmarks.clear()
        await index.put(pageId, reverseIndexDoc)
    }

    // Remove corresponding bookmark docs from pouch
    const fetchDocsByType = fetchDocTypesByUrl(url)
    const { rows: bookmarkRows } = await fetchDocsByType(bookmarkKeyPrefix)
    await deleteDocs(bookmarkRows)
}

export default removeBookmarkByUrl
