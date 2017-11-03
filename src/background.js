import urlRegex from 'url-regex'

import 'src/activity-logger/background'
import 'src/page-storage/background'
import 'src/search/background'
import 'src/bookmarks/background'
import 'src/omnibar'
import { installTimeStorageKey } from 'src/imports/background'
import { generatePageDocId } from 'src/page-storage'
import { generateVisitDocId } from 'src/activity-logger'
import { generateBookmarkDocId } from 'src/bookmarks'
import { defaultEntries, addToBlacklist } from 'src/blacklist'
import convertOldExtBlacklist, {
    CONVERT_TIME_KEY,
} from 'src/blacklist/background'
import { OLD_EXT_KEYS } from 'src/options/imports/constants'
import index from 'src/search/search-index'

export const OVERVIEW_URL = '/overview/overview.html'
export const OLD_EXT_UPDATE_KEY = 'updated-from-old-ext'

// Put doc ID generators on window for user use with manual DB lookups
window.generatePageDocId = generatePageDocId
window.generateVisitDocId = generateVisitDocId
window.generateBookmarkDocId = generateBookmarkDocId
window.index = index

async function openOverview() {
    const [currentTab] = await browser.tabs.query({ active: true })

    // Either create new tab or update current tab with overview page, depending on URL validity
    if (currentTab && currentTab.url && urlRegex().test(currentTab.url)) {
        browser.tabs.create({ url: OVERVIEW_URL })
    } else {
        browser.tabs.update({ url: OVERVIEW_URL })
    }
}

browser.commands.onCommand.addListener(command => {
    if (command === 'openOverview') {
        openOverview()
    }
})

browser.runtime.onInstalled.addListener(async details => {
    switch (details.reason) {
        case 'install':
            // Store the timestamp of when the extension was installed + default blacklist
            browser.storage.local.set({ [installTimeStorageKey]: Date.now() })
            addToBlacklist(defaultEntries)
            break
        case 'update':
            // If no prior conversion, convert old ext blacklist + show static notif page
            const {
                [CONVERT_TIME_KEY]: blacklistConverted,
                [OLD_EXT_UPDATE_KEY]: alreadyUpdated,
                [OLD_EXT_KEYS.INDEX]: oldExtIndex,
            } = await browser.storage.local.get([
                CONVERT_TIME_KEY,
                OLD_EXT_UPDATE_KEY,
                OLD_EXT_KEYS.INDEX,
            ])

            if (!blacklistConverted) {
                convertOldExtBlacklist()
            }

            // Over complicated check of old ext data + already upgraded flag to only show update page once
            if (
                !alreadyUpdated &&
                oldExtIndex &&
                oldExtIndex.index instanceof Array
            ) {
                browser.tabs.create({ url: '/update/update.html' })
                browser.storage.local.set({ [OLD_EXT_UPDATE_KEY]: Date.now() })
            }
            break
        default:
    }
})
