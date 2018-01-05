import index from './'
import { keyGen, removeKeyType } from './util'

/**
 * @param {string} [query=''] Plaintext query string to match against start of tag names.
 *  eg. 'wo' would match 'work', 'women' (assuming both these tags exist).
 * @param {number} [limit=10] Max number of suggestions to return.
 * @returns {Promise<Set<string>>} Resolves to a Set of matching tags, if any, of size 0 - `limit`.
 */
const suggestTags = (query = '', limit = 10) =>
    new Promise((resolve, reject) => {
        const results = new Set()

        // Start searching from the tag matching the query
        const startKey = keyGen.tag(query)

        index.db
            .createReadStream({
                gte: startKey,
                lte: `${startKey}\uffff`,
                values: false,
                limit,
            })
            .on('data', tagKey => results.add(removeKeyType(tagKey)))
            .on('error', reject)
            .on('end', () => resolve(results))
    })

/**
 * @param {string} pageId The ID of the page to fetch associated tags for.
 * @returns {Promise<Set<string>>} Resolves to a Set of tags associated with `pageId` - will be empty if none.
 */
export const fetchTagsForPage = pageId =>
    index
        .get(pageId, { asBuffer: false })
        .then(({ tags = [] }) => new Set([...tags].map(removeKeyType)))
        .catch(error => new Set())

export default suggestTags
