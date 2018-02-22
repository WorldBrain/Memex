import { generatePageDocId } from 'src/page-storage'
import index from '../'
import { keyGen, removeKeyType } from '../../util'

/**
 * @param {string} [query=''] Plaintext query string to match against start of tag names.
 *  eg. 'wo' would match 'work', 'women' (assuming both these tags exist).
 * @param {number} [limit=10] Max number of suggestions to return.
 * @returns {Promise<string[]>} Resolves to an array of matching tags, if any, of length 0 - `limit`.
 */
const suggestTags = (query = '', limit = 10) =>
    new Promise((resolve, reject) => {
        const results = []

        // Start searching from the tag matching the query
        const startKey = keyGen.tag(query)

        index.db
            .createReadStream({
                gte: startKey,
                lte: `${startKey}\uffff`,
                values: false,
                limit,
            })
            .on('data', tagKey => results.push(removeKeyType(tagKey)))
            .on('error', reject)
            .on('end', () => resolve(results))
    })

/**
 * @param {any} assoc Object containing either `url` or `pageId` strings - `url` will be converted
 *  to an ID of a page to fetch assoc. tags for.
 * @returns {Promise<string[]>} Resolves to an array of tags associated with `pageId` - will be empty if none.
 */
export async function fetchTags({ pageId, url }) {
    if (url != null) {
        pageId = await generatePageDocId({ url })
    }

    return index
        .get(pageId, { asBuffer: false })
        .then(({ tags = [] }) => [...tags].map(removeKeyType))
        .catch(error => [])
}

export default suggestTags
