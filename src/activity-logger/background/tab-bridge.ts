import { browser } from 'webextension-polyfill-ts'

import tabManager from './tab-manager'
import TabChangeListeners from './tab-change-listeners'
import PageVisitLogger from './log-page-visit'
import { TabChangeListener } from './types'

const pageVisitLogger = new PageVisitLogger({ tabManager })
const tabChangeListener = new TabChangeListeners({
    tabManager,
    pageVisitLogger,
})

export const tabUpdatedListener: TabChangeListener = async (
    tabId,
    changeInfo,
    tab,
) => {
    if (changeInfo.status) {
        tabManager.setTabLoaded(tabId, changeInfo.status === 'complete')
    }

    if (changeInfo.favIconUrl) {
        await tabChangeListener.handleFavIcon(tabId, changeInfo, tab)
    }

    if (changeInfo.url) {
        await tabChangeListener.handleUrl(tabId, changeInfo, tab)
    }
}

export async function trackExistingTabs({ isNewInstall = false }) {
    const tabs = await browser.tabs.query({})

    for (const tab of tabs) {
        tabManager.trackTab(tab, {
            isLoaded: tab.status === 'complete',
            isBookmarked: await tabChangeListener.checkBookmark(tab.url),
        })

        await tabChangeListener.injectContentScripts(tab)

        if (!isNewInstall) {
            continue
        }

        if (tab.favIconUrl) {
            await tabChangeListener.handleFavIcon(tab.id, tab, tab)
        }

        if (tab.url) {
            await tabChangeListener.handleUrl(tab.id, tab, tab)
        }
    }
}
