import { browser, Tabs } from 'webextension-polyfill-ts'

import tabManager from './tab-manager'
import TabChangeListeners from './tab-change-listeners'
import PageVisitLogger from './log-page-visit'
import { TabChangeListener } from './types'

const pageVisitLogger = new PageVisitLogger({ tabManager })
const tabChangeListener = new TabChangeListeners({
    tabManager,
    pageVisitLogger,
})

let resolveTabQuery
const tabQueryP = new Promise(resolve => (resolveTabQuery = resolve))

const isTabLoaded = (tab: Tabs.Tab) => tab.status === 'complete'

export const tabUpdatedListener: TabChangeListener = async (
    tabId,
    changeInfo,
    tab,
) => {
    await tabQueryP

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

    for (const browserTab of tabs) {
        tabManager.trackTab(browserTab, {
            isLoaded: isTabLoaded(browserTab),
            isBookmarked: await tabChangeListener.checkBookmark(browserTab.url),
        })

        await tabChangeListener.injectContentScripts(browserTab).catch(e => e)

        if (!isNewInstall) {
            continue
        }

        if (browserTab.favIconUrl) {
            tabChangeListener.handleFavIcon(
                browserTab.id,
                browserTab,
                browserTab,
            )
        }

        if (browserTab.url) {
            tabChangeListener.handleUrl(browserTab.id, browserTab, browserTab)
        }
    }

    resolveTabQuery()
}

export async function trackNewTab(id: number) {
    const browserTab = await browser.tabs.get(id)

    tabManager.trackTab(browserTab, {
        isLoaded: isTabLoaded(browserTab),
        isBookmarked: await tabChangeListener.checkBookmark(browserTab.url),
    })
}
