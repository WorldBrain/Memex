import { blacklist } from '../../blacklist/background'
import { isLoggable, getPauseState } from '..'
import { LoggableTabChecker, VisitInteractionUpdater, TabState } from './types'
import { SearchIndex } from 'src/search'
import { browser, Windows, Tabs } from 'webextension-polyfill-ts'

/**
 * Combines all "loggable" conditions for logging on given tab data to determine
 * whether or not a tab should be logged.
 */
export const shouldLogTab: LoggableTabChecker = async function({ url }) {
    // Short-circuit before async logic, if possible
    if (!url || !isLoggable({ url })) {
        return false
    }

    // First check if we want to log this page (hence the 'maybe' in the name).
    const isBlacklisted = await blacklist.checkWithBlacklist() // tslint:disable-line
    const isPaused = await getPauseState()

    return !isPaused && !isBlacklisted({ url })
}

/**
 * Handles update of assoc. visit with derived tab state data, using the tab state.
 *
 * @param {Tab} tabState The tab state to derive visit meta data from.
 */
export const updateVisitInteractionData: VisitInteractionUpdater = (
    tabState: TabState,
    searchIndex: SearchIndex,
) => {
    const { scrollState } = tabState
    return searchIndex
        .updateTimestampMeta(tabState.url, +tabState.visitTime, {
            duration: tabState.activeTime,
            scrollPx: scrollState.pixel,
            scrollMaxPx: scrollState.maxPixel,
            scrollPerc: scrollState.percent,
            scrollMaxPerc: scrollState.maxPercent,
        })
        .catch(f => f)
}

export async function getOpenTabsInCurrentWindow(
    windows: Windows.Static,
    queryTabs: Tabs.Static['query'],
): Promise<Array<{ tabId: number; url: string }>> {
    return (await queryTabs({ windowId: windows.WINDOW_ID_CURRENT }))
        .map(tab => ({ tabId: tab.id, url: tab.url }))
        .filter(tab => tab.tabId !== browser.tabs.TAB_ID_NONE)
}
