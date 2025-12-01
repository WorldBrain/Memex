import urlRegex from 'url-regex'

import { OVERVIEW_URL } from '../constants'

export async function openOverview() {
    const [currentTab] = await chrome.tabs.query({ active: true })
    // Either create new tab or update current tab with overview page, depending on URL validity
    if (currentTab && currentTab.url && urlRegex().test(currentTab.url)) {
        return chrome.tabs.create({ url: OVERVIEW_URL })
    } else {
        return chrome.tabs.update({ url: OVERVIEW_URL })
    }
}
