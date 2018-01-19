import index from './'
import { keyGen, removeKeyType } from './util'

/**
 * @param {string} [query=''] Plaintext query string to match against start of domain names.
 *  eg. 'wo' would match 'worldbrain.io', 'worldbrain.slack.com' (assuming both these domains exist).
 * @param {number} [limit=10] Max number of suggestions to return.
 * @returns {Promise<string[]>} Resolves to an array of matching tags, if any, of length 0 - `limit`.
 */
const suggestDomains = (query = '', limit = 10) =>
    new Promise((resolve, reject) => {
        const results = []

        // Start searching from the domain matching the query
        const startKey = keyGen.domain(query)

        index.db
            .createReadStream({
                gte: startKey,
                lte: `${startKey}\uffff`,
                values: false,
                limit,
            })
            .on('data', domainKey => results.push(removeKeyType(domainKey)))
            .on('error', reject)
            .on('end', () => resolve(results))
    })

export default suggestDomains
