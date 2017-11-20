import { STORAGE_KEYS, IMPORT_TYPE } from 'src/options/imports/constants'

export const get = async () => {
    const {
        [STORAGE_KEYS.IMPORT_CACHE]: estimates,
        [STORAGE_KEYS.IMPORT_CACHE_TIME]: calculatedAt,
    } = await browser.storage.local.get({
        [STORAGE_KEYS.IMPORT_CACHE]: {},
        [STORAGE_KEYS.IMPORT_CACHE_TIME]: 0,
    })

    return {
        ...estimates,
        calculatedAt,
    }
}

export const set = (estimates, resetTime = true) => {
    const time = resetTime
        ? { [STORAGE_KEYS.IMPORT_CACHE_TIME]: Date.now() }
        : {}

    return browser.storage.local.set({
        [STORAGE_KEYS.IMPORT_CACHE]: estimates,
        ...time,
    })
}

export const dirty = () =>
    browser.storage.local.set({
        [STORAGE_KEYS.IMPORT_CACHE_TIME]: 0,
    })

export const getItemsList = async () => {
    const {
        [STORAGE_KEYS.IMPORT_CACHE]: { remaining: items },
        [STORAGE_KEYS.ALLOW_TYPES]: allowTypes,
    } = await browser.storage.local.get({
        [STORAGE_KEYS.IMPORT_CACHE]: {},
        [STORAGE_KEYS.ALLOW_TYPES]: {},
    })

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
