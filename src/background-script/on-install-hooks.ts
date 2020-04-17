import { browser } from 'webextension-polyfill-ts'

import { generateUserId } from 'src/analytics/utils'
import { INSTALL_TIME_KEY, OVERVIEW_URL } from '../constants'
import analytics from '../analytics'
import { SEARCH_INJECTION_KEY } from '../search-injection/constants'
import {
    constants as blacklistConsts,
    blacklist,
} from '../blacklist/background'

export async function onInstall() {
    const now = Date.now()

    // Ensure default blacklist entries are stored (before doing anything else)
    await blacklist.addToBlacklist(blacklistConsts.DEF_ENTRIES)

    analytics.trackEvent({ category: 'Global', action: 'installExtension' })

    // Open onboarding page
    browser.tabs.create({ url: `${OVERVIEW_URL}?install=true` })

    // Store the timestamp of when the extension was installed
    browser.storage.local.set({ [INSTALL_TIME_KEY]: now })

    await generateUserId({})
}

export async function onUpdate() {
    // Check whether old Search Injection boolean exists and replace it with new object
    const searchInjectionKey = (
        await browser.storage.local.get(SEARCH_INJECTION_KEY)
    )[SEARCH_INJECTION_KEY]

    if (typeof searchInjectionKey === 'boolean') {
        browser.storage.local.set({
            [SEARCH_INJECTION_KEY]: {
                google: searchInjectionKey,
                duckduckgo: true,
            },
        })
    }

    await generateUserId({})
}
