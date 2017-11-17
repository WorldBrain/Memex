import omit from 'lodash/fp/omit'

import { STORAGE_KEYS, IMPORT_TYPE } from 'src/options/imports/constants'

export const get = async () => {
    const storage = await browser.storage.local.get({
        [STORAGE_KEYS.IMPORT_CACHE]: { calculatedAt: 0 },
    })
    return storage[STORAGE_KEYS.IMPORT_CACHE]
}

export const set = estimates =>
    browser.storage.local.set({
        [STORAGE_KEYS.IMPORT_CACHE]: { ...estimates, calculatedAt: Date.now() },
    })

export const dirty = () =>
    browser.storage.local.set({
        [STORAGE_KEYS.IMPORT_CACHE]: { calculatedAt: 0 },
    })

export const removeItem = async (encodedUrl, { type, hasBookmark }) => {
    const omitItemKey = omit(encodedUrl)
    const { remaining, completedCounts } = await get()

    // Delete key from remaining set
    const newRemaining = {
        [IMPORT_TYPE.OLD]: omitItemKey(remaining[IMPORT_TYPE.OLD]),
        [IMPORT_TYPE.HISTORY]: omitItemKey(remaining[IMPORT_TYPE.HISTORY]),
        [IMPORT_TYPE.BOOKMARK]: omitItemKey(remaining[IMPORT_TYPE.BOOKMARK]),
    }

    // Increment counts
    if (type === IMPORT_TYPE.OLD) {
        completedCounts[IMPORT_TYPE.OLD]++
        if (hasBookmark) {
            completedCounts[IMPORT_TYPE.BOOKMARK]++
        }
    } else if (type === IMPORT_TYPE.BOOKMARK) {
        completedCounts[IMPORT_TYPE.BOOKMARK]++
    }
    completedCounts[IMPORT_TYPE.HISTORY]++

    // Set new state
    await set({
        remaining: newRemaining,
        completedCounts,
    })
}

export const getItemsList = async () => {
    const {
        [STORAGE_KEYS.IMPORT_CACHE]: { remaining: items },
        [STORAGE_KEYS.ALLOW_TYPES]: allowTypesJSON,
    } = await browser.storage.local.get({
        [STORAGE_KEYS.IMPORT_CACHE]: { calculatedAt: 0 },
        [STORAGE_KEYS.ALLOW_TYPES]: '{}',
    })

    let allowTypes
    try {
        allowTypes = JSON.parse(allowTypesJSON)
    } catch (error) {
        allowTypes = {}
    }

    return new Map(
        Object.entries({
            ...(allowTypes[IMPORT_TYPE.HISTORY]
                ? items[IMPORT_TYPE.HISTORY]
                : {}),
            ...(allowTypes[IMPORT_TYPE.BOOKMARK]
                ? items[IMPORT_TYPE.BOOKMARK]
                : {}),
            ...(allowTypes[IMPORT_TYPE.OLD] ? items[IMPORT_TYPE.OLD] : {}),
        }),
    )
}
