import * as constants from './constants'
import * as utils from './utils'
import { handleRender } from './dom'
import { createSyncSettingsStore } from 'src/sync-settings/util'

const url = window.location.href
const matched = utils.matchURL(url)

/**
 * Fetches SearchInjection user preferance from storage.
 * If set, proceed with matching URL and fetching search query
 */
export async function initSearchInjection({ requestSearcher, syncSettingsBG }) {
    const syncSettings = createSyncSettingsStore({ syncSettingsBG })
    const searchInjection =
        (await syncSettings.searchInjection.get('searchEnginesEnabled')) ??
        constants.SEARCH_INJECTION_DEFAULT

    if (matched && searchInjection[matched]) {
        try {
            const query = utils.fetchQuery(url)

            await handleRender(query, requestSearcher, matched, syncSettings)
        } catch (err) {
            console.error(err)
        }
    }
}
