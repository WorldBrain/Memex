import { generatePageDocId } from 'src/page-storage'
import index from '..'
import { delPageFromTagValue } from './del'
import { fetchExistingPage, initSingleLookup } from '../util'
import { keyGen } from '../../util'

const singleLookup = initSingleLookup()

/**
 * @param {[string, any]} pageEntry The Map entry to add to tag value.
 * @returns {(tagKey: string) => Promise<void>} A fn affording add the `pageEntry` entry at any given tag Map value.
 */
export const addPageToTagValue = pageEntry =>
    async function(tagKey) {
        let value = await singleLookup(tagKey)

        if (value != null) {
            value.set(...pageEntry) // Update existing tag key
        } else {
            value = new Map([pageEntry]) // Make new Map value for non-existent tag key
        }
        return await index.put(tagKey, value)
    }

/**
 * @param {any} assoc Object containing either `url` or `pageId` strings - `url` will be converted
 *  to an ID of a page to associate with.
 * @param {string[]} tags Array of tags to associate with page.
 * @returns {Promise<void>}
 */
export async function setTags({ pageId, url }, tags) {
    if (url != null) {
        pageId = await generatePageDocId({ url })
    }

    const reverseIndexDoc = await fetchExistingPage(pageId)
    const keyedTags = new Set(tags.map(keyGen.tag))

    // Difference of existing tags and input tags will need to be deindexed
    const tagsToRemove = [...(reverseIndexDoc.tags || [])].filter(
        tag => !keyedTags.has(tag),
    )

    // Add/update new/existing entries to tags index + delete all unneeded ones + update reverse index doc
    await Promise.all([
        ...[...keyedTags].map(
            addPageToTagValue([pageId, { latest: reverseIndexDoc.latest }]),
        ),
        ...tagsToRemove.map(delPageFromTagValue(pageId)),
        index.put(pageId, { ...reverseIndexDoc, tags: keyedTags }), // Also update reverse index doc
    ])
}

/**
 * @param {any} assoc Object containing either `url` or `pageId` strings - `url` will be converted
 *  to an ID of a page to associate with.
 * @param {string[]} tags Array of tags to associate with page.
 * @returns {Promise<void>}
 */
export async function addTags({ pageId, url }, tags) {
    if (url != null) {
        pageId = await generatePageDocId({ url })
    }

    const reverseIndexDoc = await fetchExistingPage(pageId)

    // Init tags Set if not present
    if (reverseIndexDoc.tags == null) {
        reverseIndexDoc.tags = new Set()
    }

    // Convert all input tags into tags index keys
    const keyedTags = tags.map(keyGen.tag)

    // Add all tag keys to reverse index doc
    keyedTags.forEach(tagKey => reverseIndexDoc.tags.add(tagKey))

    // Add entries to tags index + update reverse index doc
    await Promise.all([
        ...keyedTags.map(
            addPageToTagValue([pageId, { latest: reverseIndexDoc.latest }]),
        ),
        index.put(pageId, reverseIndexDoc), // Also update reverse index doc
    ])
}
