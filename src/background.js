import urlRegex from 'url-regex'
import 'src/activity-logger/background'
import 'src/blacklist/background'
import 'src/search/background'
import 'src/bookmarks/background'
import 'src/omnibar'
import { installTimeStorageKey } from 'src/imports/background'
import { generatePageDocId } from 'src/page-storage'
import { generateVisitDocId } from 'src/activity-logger'
import { generateBookmarkDocId } from 'src/bookmarks'
import { defaultEntries, addToBlacklist } from 'src/blacklist'

export const dataConvertTimeKey = 'data-conversion-timestamp'
export const OVERVIEW_URL = '/overview/overview.html'

// Put doc ID generators on window for user use with manual DB lookups
window.generatePageDocId = generatePageDocId
window.generateVisitDocId = generateVisitDocId
window.generateBookmarkDocId = generateBookmarkDocId

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
    if (details.reason === 'install') {
        // Store the timestamp of when the extension was installed in local storage
        browser.storage.local.set({ [installTimeStorageKey]: Date.now() })

        // Set the default blacklist entries
        addToBlacklist(defaultEntries)
    }
})
