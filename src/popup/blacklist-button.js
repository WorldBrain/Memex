import { checkWithBlacklist } from 'src/activity-logger'

/**
 * Checks currently opened tab URL against blacklist to see whether or not it's blacklisted.
 * @returns {boolean} Denotes whether current page/tab is blacklisted or not.
 */
export async function getCurrentPageBlacklistedState() {
    const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true })

    if (!currentTab || !currentTab.url) {
        throw new Error('Cannot get current tab to check blacklist for')
    }

    const shouldBeRemembered = await checkWithBlacklist()
    return !shouldBeRemembered({ url: currentTab.url })
}
