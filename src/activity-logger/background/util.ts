import { blacklist } from '../../blacklist/background'
import { isLoggable, getPauseState } from '..'
import { LoggableTabChecker, VisitInteractionUpdater, TabState } from './types'
import { SearchIndex } from 'src/search'

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
