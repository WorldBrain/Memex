import { browser, Tabs } from 'webextension-polyfill-ts'

import searchIndex from '../../search'
import { blacklist } from '../../blacklist/background'
import { isLoggable, getPauseState } from '..'
import { TabState } from './types'

/**
 * Combines all "loggable" conditions for logging on given tab data to determine
 * whether or not a tab should be logged.
 */
export async function shouldLogTab({ url, incognito }: Tabs.Tab) {
    // Short-circuit before async logic, if possible
    if (incognito || !url || !isLoggable({ url })) {
        return false
    }

    // First check if we want to log this page (hence the 'maybe' in the name).
    const isBlacklisted = await blacklist.checkWithBlacklist()
    const isPaused = await getPauseState()

    return !isPaused && !isBlacklisted({ url })
}

/**
 * Handles update of assoc. visit with derived tab state data, using the tab state.
 *
 * @param {Tab} tab The tab state to derive visit meta data from.
 */
export const updateVisitInteractionData = ({
    url,
    visitTime,
    activeTime,
    scrollState,
}: TabState) =>
    searchIndex
        .updateTimestampMeta(url, +visitTime, {
            duration: activeTime,
            scrollPx: scrollState.pixel,
            scrollMaxPx: scrollState.maxPixel,
            scrollPerc: scrollState.percent,
            scrollMaxPerc: scrollState.maxPercent,
        })
        .catch(f => f)
