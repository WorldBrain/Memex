import { browser } from 'webextension-polyfill-ts'

import { generateTokenIfNot } from '../util/generate-token'
import { INSTALL_TIME_KEY, OVERVIEW_URL } from '../constants'
import analytics from '../analytics'
import { SEARCH_INJECTION_KEY } from '../search-injection/constants'
import {
    constants as blacklistConsts,
    blacklist,
} from '../blacklist/background'
import tabManager from '../activity-logger/background/tab-manager'
import TabChangeListener from '../activity-logger/background/tab-change-listeners'
import PageVisitLogger from '../activity-logger/background/log-page-visit'

const pageVisitLogger = new PageVisitLogger({ tabManager })
const tabChangeListener = new TabChangeListener({ tabManager, pageVisitLogger })

export async function onInstall() {
    const now = Date.now()

    // Ensure default blacklist entries are stored (before doing anything else)
    await blacklist.addToBlacklist(blacklistConsts.DEF_ENTRIES)

    analytics.trackEvent({ category: 'Global', action: 'Install' }, true)

    // Open onboarding page
    browser.tabs.create({ url: `${OVERVIEW_URL}?install=true` })

    // Store the timestamp of when the extension was installed
    browser.storage.local.set({ [INSTALL_TIME_KEY]: now })

    await generateTokenIfNot({ installTime: now })
}

export async function onUpdate() {
    const tabs = await browser.tabs.query({})

    for (const tab of tabs) {
        tabManager.trackTab(tab)

        if (tab.favIconUrl) {
            await tabChangeListener.handleFavIcon(tab.id, tab, tab)
        }

        if (tab.url) {
            await tabChangeListener.handleUrl(tab.id, tab, tab)
            if (tab.url !== 'chrome://extensions/') {
                await browser.tabs.executeScript(tab.id, {
                    file: 'content_script.js',
                })
            }
        }
    }

    // Check whether old Search Injection boolean exists and replace it with new object
    const searchInjectionKey = (await browser.storage.local.get(
        SEARCH_INJECTION_KEY,
    ))[SEARCH_INJECTION_KEY]

    if (typeof searchInjectionKey === 'boolean') {
        browser.storage.local.set({
            [SEARCH_INJECTION_KEY]: {
                google: searchInjectionKey,
                duckduckgo: true,
            },
        })
    }

    const installTime = (await browser.storage.local.get(INSTALL_TIME_KEY))[
        INSTALL_TIME_KEY
    ]

    await generateTokenIfNot({ installTime })
}
