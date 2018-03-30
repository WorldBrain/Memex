import { generatePageDocId } from 'src/page-storage'
import index from '..'
import { fetchExistingPage, keyGen, initSingleLookup } from '../util'

const singleLookup = initSingleLookup()

/**
 * @param {string} pageId The key of the Map entry to remove.
 * @returns {(tagKey: string) => Promise<void>} A fn affording add the removal of `pageId` key at any given tag Map value.
 */
export const delPageFromTagValue = pageId =>
    async function(tagKey) {
        const value = await singleLookup(tagKey)

        if (value == null) {
            return Promise.resolve() // Do nothing if non-existent
        }

        value.delete(pageId) // Remove page from current indexed tag value Map

        // Remove tag index entry if no more assoc. page entries left in value, else just update
        return value.size
            ? await index.put(tagKey, value)
            : await index.del(tagKey)
    }

/**
 * @param {any} assoc Object containing either `url` or `pageId` strings - `url` will be converted
 *  to an ID of a page to remove associate with.
 * @param {string[]} tags Array of tags to remove association from page.
 * @returns {Promise<void>}
 */
export async function delTags({ url, pageId }, tags) {
    if (url != null) {
        pageId = await generatePageDocId({ url })
    }

    const reverseIndexDoc = await fetchExistingPage(pageId)

    // Convert all input tags into tags index keys
    const keyedTags = tags.map(keyGen.tag)

    // Remove all tag keys to reverse index doc
    keyedTags.forEach(tagKey => reverseIndexDoc.tags.delete(tagKey))

    // Remove entries to tags index + update reverse index doc
    await Promise.all([
        ...keyedTags.map(delPageFromTagValue(pageId)),
        index.put(pageId, reverseIndexDoc), // Also update reverse index doc
    ])
}
