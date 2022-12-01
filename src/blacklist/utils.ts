import browser from 'webextension-polyfill'
import { INPAGE_UI_BLACKLIST_STORAGE_KEY } from './constants'
import type { BlacklistEntry } from './types'

export const getUrlBlacklist = async (): Promise<BlacklistEntry[]> => {
    const storageValues = await browser.storage.local.get(
        INPAGE_UI_BLACKLIST_STORAGE_KEY,
    )
    return storageValues[INPAGE_UI_BLACKLIST_STORAGE_KEY] ?? []
}

export const checkPageBlacklisted = async (
    fullPageUrl: string,
): Promise<boolean> => {
    const urlBlacklist = await getUrlBlacklist()
    for (const { expression } of urlBlacklist) {
        if (fullPageUrl.match(expression)) {
            return true
        }
    }
    return false
}

export const addUrlToBlacklist = async (pageUrl: string): Promise<void> => {
    const urlBlacklist = await getUrlBlacklist()
    pageUrl = pageUrl.replace(/\s+/g, '').replace('.', '\\.')

    const isAlreadyAdded = urlBlacklist.reduce(
        (prev, curr) => prev || curr.expression === pageUrl,
        false,
    )
    if (isAlreadyAdded) {
        return
    }

    await browser.storage.local.set({
        [INPAGE_UI_BLACKLIST_STORAGE_KEY]: [
            ...urlBlacklist,
            { expression: pageUrl, dateAdded: Date.now() },
        ],
    })
}
