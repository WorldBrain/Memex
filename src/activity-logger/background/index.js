import noop from 'lodash/fp/noop'

import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import { whenPageDOMLoaded, whenTabActive } from 'src/util/tab-events'
import { updateTimestampMetaConcurrent } from 'src/search'
import { blacklist } from 'src/blacklist/background'
import { logPageVisit } from './log-page-visit'
import initPauser from './pause-logging'
import tabTracker from './tab-time-tracker'
import { isLoggable, getPauseState, visitKeyPrefix } from '..'

// Allow logging pause state toggle to be called from other scripts
const toggleLoggingPause = initPauser()
makeRemotelyCallable({ toggleLoggingPause })

// Ensure tab scroll states are kept in-sync with scroll events from the content script
browser.runtime.onMessage.addListener(
    ({ funcName, ...scrollState }, { tab }) => {
        if (funcName !== 'updateScrollState' || tab == null) {
            return
        }
        tabTracker.updateTabScrollState(tab.id, scrollState)
    },
)

/**
 * Combines all "logibility" conditions for logging on given tab data to determine
 * whether or not a tab should be logged.
 *
 * @param {tabs.Tab}
 * @returns {Promise<boolean>}
 */
async function shouldLogTab(tab) {
    // Short-circuit before async logic, if possible
    if (!tab.url || !isLoggable(tab)) {
        return false
    }

    // First check if we want to log this page (hence the 'maybe' in the name).
    const isBlacklisted = await blacklist.checkWithBlacklist()
    const isPaused = await getPauseState()

    return !isPaused && !isBlacklisted(tab)
}

/**
 * Handles update of assoc. visit with derived tab state data, using the tab state.
 *
 * @param {TabActiveState} tab The tab state to derive visit meta data from.
 */
async function updateVisitForTab({ visitTime, activeTime, scrollState }) {
    const visitKey = visitKeyPrefix + visitTime

    try {
        await updateTimestampMetaConcurrent(visitKey, data => ({
            ...data,
            duration: activeTime,
            scrollPx: scrollState.pixel,
            scrollMaxPx: scrollState.maxPixel,
            scrollPerc: scrollState.percent,
            scrollMaxPerc: scrollState.maxPercent,
        }))
    } catch (error) {
        // If visit was never indexed for tab, cannot update it - move on
    }
}

browser.tabs.onCreated.addListener(tab => tabTracker.trackTab(tab))
browser.tabs.onActivated.addListener(({ tabId }) =>
    tabTracker.activateTab(tabId),
)

// Remove tab from tab tracking state and update the visit with tab-derived metadata
browser.tabs.onRemoved.addListener(tabId =>
    updateVisitForTab(tabTracker.removeTab(tabId)),
)

browser.tabs.onUpdated.addListener(async function(tabId, changeInfo, tab) {
    // `changeInfo` should only contain `url` prop if URL changed, which is what we care about
    if (changeInfo.url) {
        // Ensures the URL change counts as a new visit in tab state (tab ID doesn't change)
        const oldTab = tabTracker.resetTab(tabId, tab.active)
        updateVisitForTab(oldTab) // Send off request for updating that prev. visit's tab state

        const shouldLog = await shouldLogTab(tab)
        if (shouldLog) {
            tabTracker.scheduleTabLog(
                tabId,
                () =>
                    // Wait until its DOM has loaded, and activated before attemping log
                    whenPageDOMLoaded({ tabId })
                        .then(() => whenTabActive({ tabId }))
                        .then(() => logPageVisit({ url: tab.url, tabId }))
                        .catch(noop), // Ignore any tab state interuptions
            )
        }
    }
})
