import urlRegex from 'url-regex'
import { browser } from 'webextension-polyfill-ts'

import { OVERVIEW_URL } from '../constants'

export async function openOverview() {
    const [currentTab] = await browser.tabs.query({ active: true })
    // Either create new tab or update current tab with overview page, depending on URL validity
    if (currentTab && currentTab.url && urlRegex().test(currentTab.url)) {
        return browser.tabs.create({ url: OVERVIEW_URL })
    } else {
        return browser.tabs.update({ url: OVERVIEW_URL })
    }
}
