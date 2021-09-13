import * as constants from './constants'
import * as utils from './utils'
import { handleRender } from './dom'
import { createUISyncSettings } from 'src/sync-settings/ui/util'

const url = window.location.href
const matched = utils.matchURL(url)

/**
 * Fetches SearchInjection user preferance from storage.
 * If set, proceed with matching URL and fetching search query
 */
export async function initSearchInjection({ requestSearcher, syncSettingsBG }) {
    const syncSettings = createUISyncSettings({ syncSettingsBG })
    const searchInjection =
        (await syncSettings.searchInjection.get('searchEnginesEnabled')) ??
        constants.SEARCH_INJECTION_DEFAULT

    if (matched && searchInjection[matched]) {
        try {
            const query = utils.fetchQuery(url)
            const searchRes = await requestSearcher({ query, limit: 21 })
            if (searchRes.docs.length) {
                await handleRender(searchRes, matched, syncSettings)
            }
        } catch (err) {
            // Let it fail
        }
    }
}
