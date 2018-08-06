import urlRegex from 'url-regex'

import 'src/activity-logger/background'
import 'src/search/background'
import 'src/analytics/background'
import 'src/imports/background'
import DirectLinkingBackground from 'src/direct-linking/background'
import EventLogBackground from 'src/analytics/internal/background'
import CustomListBackground from 'src/custom-lists/background'
import NotificationBackground from 'src/notifications/background'
import 'src/omnibar'
import { INSTALL_TIME_KEY } from './constants'
import {
    constants as blacklistConsts,
    blacklist,
} from 'src/blacklist/background'
import searchIndex from 'src/search'
import analytics from 'src/analytics'
import {
    OPEN_OVERVIEW,
    OPEN_OPTIONS,
    SEARCH_INJECTION_KEY,
} from 'src/search-injection/constants'
import db, { storageManager } from 'src/search/search-index-new'
import * as models from 'src/search/search-index-new/models'
import 'src/search/migration'
import initSentry from './util/raven'
import { USER_ID, generateTokenIfNot } from 'src/util/generate-token'
import { API_HOST } from 'src/analytics/internal/constants'
import { storageChangesManager } from 'src/util/storage-changes'

window.index = searchIndex
window.storage = db
window.indexModels = models

initSentry()

export const OPTIONS_URL = '/options.html'
export const OVERVIEW_URL = `${OPTIONS_URL}#/overview`
export const OLD_EXT_UPDATE_KEY = 'updated-from-old-ext'
export const UNINSTALL_URL =
    process.env.NODE_ENV === 'production'
        ? 'http://worldbrain.io/uninstall'
        : ''
export const NEW_FEATURE_NOTIF = {
    title: 'NEW FEATURE: Annotations',
    message: 'Click to learn more',
    url: 'https://worldbrain.helprace.com/i66-annotations-comments',
}

const notifications = new NotificationBackground({ storageManager })
notifications.setupRemoteFunctions()

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
    await notifications.deliverStaticNotifications()
    const now = Date.now()

    // Ensure default blacklist entries are stored (before doing anything else)
    await blacklist.addToBlacklist(blacklistConsts.DEF_ENTRIES)
    analytics.trackEvent({ category: 'Global', action: 'Install' }, true)
    // Open onboarding page
    browser.tabs.create({ url: `${OVERVIEW_URL}?install=true` })
    // Store the timestamp of when the extension was installed + default blacklist
    browser.storage.local.set({ [INSTALL_TIME_KEY]: now })

    await generateTokenIfNot({ installTime: now })
}

async function onUpdate() {
    await notifications.deliverStaticNotifications()

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

storageChangesManager.addListener('local', USER_ID, ({ newValue }) => {
    browser.runtime.setUninstallURL(`${API_HOST}/uninstall?user=${newValue}`)
})

const directLinking = new DirectLinkingBackground({ storageManager })
directLinking.setupRemoteFunctions()
directLinking.setupRequestInterceptor()
window.directLinking = directLinking

const eventLog = new EventLogBackground({ storageManager })
eventLog.setupRemoteFunctions()
window.eventLog = eventLog

const customList = new CustomListBackground({ storageManager })
customList.setupRemoteFunctions()

window.notifications = notifications
