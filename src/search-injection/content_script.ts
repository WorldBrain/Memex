import * as constants from './constants'
import * as utils from './utils'
import { handleRenderSearchInjection } from './searchInjection'
import { handleRenderYoutubeInterface } from './youtubeInterface'
import { renderErrorDisplay } from './error-display'
import { renderSearchDisplay } from './search-display'
import type { InPageUIInjectionsDependencies } from 'src/content-scripts/content_script/types'

const url = window.location.href
const matched = utils.matchURL(url)

/**
 * Fetches SearchInjection user preferance from storage.
 * If set, proceed with matching URL and fetching search query
 */
export async function initInPageUIInjections({
    syncSettings,
    syncSettingsBG,
    requestSearcher,
    annotationsFunctions,
    onDemandDisplay,
}: InPageUIInjectionsDependencies) {
    if (onDemandDisplay?.errorDisplayProps != null) {
        renderErrorDisplay(onDemandDisplay.errorDisplayProps)
        return
    }

    if (onDemandDisplay?.searchDisplayProps != null) {
        renderSearchDisplay(onDemandDisplay.searchDisplayProps)
        return
    }

    if (url.includes('youtube.com')) {
        await handleRenderYoutubeInterface(
            syncSettings,
            syncSettingsBG,
            annotationsFunctions,
        )
        return
    }

    if (matched) {
        const searchInjection =
            (await syncSettings.searchInjection.get('searchEnginesEnabled')) ??
            constants.SEARCH_INJECTION_DEFAULT
        if (searchInjection[matched]) {
            try {
                const query = utils.fetchQuery(url)

                await handleRenderSearchInjection(
                    query,
                    requestSearcher,
                    matched,
                    syncSettings,
                )
            } catch (err) {
                console.error(err)
            }
        }
    }
}
