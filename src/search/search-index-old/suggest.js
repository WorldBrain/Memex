import index from './'
import { keyGen, removeKeyType } from '../util'

/**
 * @param {string} [query=''] Plaintext query string to match against start of domain and tag names.
 * @param {string} [type={domain|tag}] Plaintext query string to match against start of domain and tag names.
 *  eg. 'wo' would match 'worldbrain.io', 'worldbrain.slack.com' (assuming both these domains exist).
 *  eg. 'ca' would match 'car', 'cannot' (assuming both these tags exist).
 * @param {number} [limit=10] Max number of suggestions to return.
 * @returns {Promise<string[]>} Resolves to an array of matching tags, if any, of length 0 - `limit`.
 */
const suggest = (query = '', type, limit = 10) =>
    new Promise((resolve, reject) => {
        const results = []
        // Start searching from the domain or tag matching the query
        const startKey = keyGen[type](query)

        index.db
            .createReadStream({
                gte: startKey,
                lte: `${startKey}\uffff`,
                values: false,
                limit,
            })
            .on('data', key => results.push(removeKeyType(key)))
            .on('error', reject)
            .on('end', () => resolve(results))
    })

export default suggest
