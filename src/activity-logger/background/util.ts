import { blacklist } from '../../blacklist/background'
import { isLoggable, getPauseState } from '..'
import { LoggableTabChecker, VisitInteractionUpdater } from './types'
import { SearchIndex } from 'src/search'
import { browser, Windows, Tabs } from 'webextension-polyfill-ts'
import { TabState } from 'src/tab-management/background/types'

/**
 * Combines all "loggable" conditions for logging on given tab data to determine
 * whether or not a tab should be logged.
 */
export const shouldLogTab: LoggableTabChecker = async function ({ url }) {
    // Short-circuit before async logic, if possible
    if (!url || !isLoggable({ url })) {
        return false
    }

    // First check if we want to log this page (hence the 'maybe' in the name).
    const isBlacklisted = await blacklist.checkWithBlacklist() // tslint:disable-line
    const isPaused = await getPauseState()

    return !isPaused && !isBlacklisted({ url })
}
