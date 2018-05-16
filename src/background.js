import urlRegex from 'url-regex'

import 'src/activity-logger/background'
import 'src/search/background'
import 'src/analytics/background'
import 'src/omnibar'
import { installTimeStorageKey } from 'src/imports/background'
import {
    constants as blacklistConsts,
    blacklist,
} from 'src/blacklist/background'
import searchIndex from 'src/search'
import analytics from 'src/analytics'
// import createNotif from 'src/util/notifications'
import {
    OPEN_OVERVIEW,
    OPEN_OPTIONS,
    SEARCH_INJECTION_KEY,
} from 'src/search-injection/constants'
import db from 'src/search/search-index-new'
import * as models from 'src/search/search-index-new/models'
import 'src/search/migration'
import initSentry from './util/raven'

window.index = searchIndex
window.storage = db
window.indexModels = models

initSentry()

export const OPTIONS_URL = '/options/options.html'
export const OVERVIEW_URL = `${OPTIONS_URL}#/overview`
export const OLD_EXT_UPDATE_KEY = 'updated-from-old-ext'
export const UPDATE_URL = '/update/update.html'
export const UNINSTALL_URL =
    process.env.NODE_ENV === 'production'
        ? 'http://worldbrain.io/uninstall'
        : ''
export const NEW_FEATURE_NOTIF = {
    title: 'NEW FEATURE: Tagging',
    message: 'Click for more Information',
    url: 'https://worldbrain.helprace.com/i34-feature-tagging',
}

async function openOverview() {
    const [currentTab] = await browser.tabs.query({ active: true })

    // Either create new tab or update current tab with overview page, depending on URL validity
    if (currentTab && currentTab.url && urlRegex().test(currentTab.url)) {
        browser.tabs.create({ url: OVERVIEW_URL })
    } else {
        browser.tabs.update({ url: OVERVIEW_URL })
    }
}

const openOverviewURL = query =>
    browser.tabs.create({
        url: `${OVERVIEW_URL}?query=${query}`,
    })

const openOptionsURL = query =>
    browser.tabs.create({
        url: `${OPTIONS_URL}#${query}`,
    })

async function onInstall() {
    // Ensure default blacklist entries are stored (before doing anything else)
    await blacklist.addToBlacklist(blacklistConsts.DEF_ENTRIES)
    analytics.trackEvent({ category: 'Global', action: 'Install' }, true)
    // Open onboarding page
    browser.tabs.create({ url: `${OVERVIEW_URL}?install=true` })
    // Store the timestamp of when the extension was installed + default blacklist
    browser.storage.local.set({ [installTimeStorageKey]: Date.now() })
}

async function onUpdate() {
    // Notification with updates when we update
    // await createNotif(
    //     {
    //         title: NEW_FEATURE_NOTIF.title,
    //         message: NEW_FEATURE_NOTIF.message,
    //     },
    //     () => browser.tabs.create({ url: NEW_FEATURE_NOTIF.url }),
    // )

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
}

browser.commands.onCommand.addListener(command => {
    switch (command) {
        case 'openOverview':
            return openOverview()
        default:
    }
})

// Open an extension URL on receving message from content script
browser.runtime.onMessage.addListener(({ action, query }) => {
    switch (action) {
        case OPEN_OVERVIEW:
            return openOverviewURL(query)
        case OPEN_OPTIONS:
            return openOptionsURL(query)
        default:
    }
})

browser.runtime.onInstalled.addListener(details => {
    switch (details.reason) {
        case 'install':
            return onInstall()
        case 'update':
            return onUpdate()
        default:
    }
})

// Open uninstall survey on ext. uninstall
browser.runtime.setUninstallURL(UNINSTALL_URL)
