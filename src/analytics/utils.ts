import { v4 as uuidv4 } from 'uuid'
import browser, { Storage } from 'webextension-polyfill'

import { STORAGE_KEYS } from './constants'

/**
 * Update the last recorded user activity timestamp (used for determining user activity in given periods).
 */
export const updateLastActive = () =>
    browser.storage.local.set({
        [STORAGE_KEYS.LAST_ACTIVE]: Date.now(),
    })

export async function generateUserId({
    generateId = uuidv4,
    storage = browser.storage,
    storageKey = STORAGE_KEYS.USER_ID,
}: {
    generateId?: () => string
    storage?: Storage.Static
    storageKey?: string
}): Promise<string> {
    const userId: string | undefined = (await storage.local.get(storageKey))[
        storageKey
    ]

    if (userId) {
        return userId
    }

    const newId = generateId()
    await storage.local.set({ [storageKey]: newId })
    return newId
}
