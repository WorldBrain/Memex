import urlRegex from 'url-regex'
import 'src/activity-logger/background'
import 'src/search/background'
import 'src/analytics/background'
import 'src/omnibar'
import { installTimeStorageKey } from 'src/imports/background'
import {
    constants as blacklistConsts,
    blacklist,
    convertOldExtBlacklist,
} from 'src/blacklist/background'
import { OLD_EXT_KEYS } from 'src/options/imports/constants'
import { index } from 'src/search'
import analytics from 'src/analytics'
import updateNotification from 'src/util/update-notification'
import db from 'src/search/search-index-new'
import * as models from 'src/search/search-index-new/models'

window.index = db
window.indexModels = models

export const OVERVIEW_URL = '/overview/overview.html'
export const OLD_EXT_UPDATE_KEY = 'updated-from-old-ext'
export const UPDATE_URL = '/update/update.html'
export const UNINSTALL_URL =
    process.env.NODE_ENV === 'production'
        ? 'http://worldbrain.io/uninstall'
        : ''

window.oldIndex = index

async function openOverview() {
    const [currentTab] = await browser.tabs.query({ active: true })

    // Either create new tab or update current tab with overview page, depending on URL validity
    if (currentTab && currentTab.url && urlRegex().test(currentTab.url)) {
        browser.tabs.create({ url: OVERVIEW_URL })
    } else {
        browser.tabs.update({ url: OVERVIEW_URL })
    }
}

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
    updateNotification()

    // If no prior conversion, convert old ext blacklist + show static notif page
    const {
        [blacklistConsts.CONVERT_TIME_KEY]: blacklistConverted,
        [OLD_EXT_UPDATE_KEY]: alreadyUpdated,
        [OLD_EXT_KEYS.INDEX]: oldExtIndex,
    } = await browser.storage.local.get([
        blacklistConsts.CONVERT_TIME_KEY,
        OLD_EXT_UPDATE_KEY,
        OLD_EXT_KEYS.INDEX,
    ])

    if (!blacklistConverted) {
        convertOldExtBlacklist()
    }

    // Over complicated check of old ext data + already upgraded flag to only show update page once
    if (!alreadyUpdated && oldExtIndex && oldExtIndex.index instanceof Array) {
        browser.tabs.create({ url: UPDATE_URL })
        browser.storage.local.set({ [OLD_EXT_UPDATE_KEY]: Date.now() })
    }
}

browser.commands.onCommand.addListener(command => {
    switch (command) {
        case 'openOverview':
            return openOverview()
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
