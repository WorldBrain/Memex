import urlRegex from 'url-regex'
import { browser } from 'webextension-polyfill-ts'

import { OPTIONS_URL, OVERVIEW_URL, LEARN_MORE_URL } from '../constants'

export const openOverviewURL = (query?: string) =>
    browser.tabs.create({
        url:
            query !== undefined
                ? `${OVERVIEW_URL}?query=${query}`
                : `${OVERVIEW_URL}`,
    })

export const openOptionsURL = (query: string) =>
    browser.tabs.create({
        url: `${OPTIONS_URL}#${query}`,
    })

export const openLearnMoreURL = (url: string = LEARN_MORE_URL) =>
    browser.tabs.create({ url })

export async function openOverview() {
    const [currentTab] = await browser.tabs.query({ active: true })
    // Either create new tab or update current tab with overview page, depending on URL validity
    if (currentTab && currentTab.url && urlRegex().test(currentTab.url)) {
        return browser.tabs.create({ url: OVERVIEW_URL })
    } else {
        return browser.tabs.update({ url: OVERVIEW_URL })
    }
}
