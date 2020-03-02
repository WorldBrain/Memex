import * as constants from './constants'
import * as utils from './utils'
import { handleRender } from './dom'
import { remoteFunction } from '../util/webextensionRPC'

const requestSearch = remoteFunction('search')
const url = window.location.href
const matched = utils.matchURL(url)

/**
 * Fetches SearchInjection user preferance from storage.
 * If set, proceed with matching URL and fetching search query
 */
export async function initSearchInjection() {
    const searchInjection = await utils.getLocalStorage(
        constants.SEARCH_INJECTION_KEY,
        constants.SEARCH_INJECTION_DEFAULT,
    )

    if (matched && searchInjection[matched]) {
        try {
            const query = utils.fetchQuery(url)
            const searchRes = await requestSearch({ query, limit: 5 })

            if (searchRes.docs.length || searchRes.requiresMigration) {
                handleRender(searchRes, matched)
            }
        } catch (err) {
            // Let it fail
        }
    }
}
