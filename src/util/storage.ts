import { Browser, browser } from 'webextension-polyfill-ts'
import { BackupStatusType } from 'src/backup-restore/types'

export interface LocalStorageTypes {
    'backup-status': BackupStatusType
}

export async function getLocalStorageTyped<
    T extends keyof LocalStorageTypes,
    U extends LocalStorageTypes[T]
>(
    key: T,
    defVal?: U,
    localStorage: Pick<Browser['storage']['local'], 'get'> = null,
): Promise<LocalStorageTypes[T]> {
    return getLocalStorage(key, defVal, localStorage)
}

export async function getLocalStorage(
    key,
    defVal?: any,
    localStorage: Pick<Browser['storage']['local'], 'get'> = null,
) {
    // KEY: (string)
    // defVal: (any) default value of the key to set, if undefined
    // gets the value, or if undefined stores it
    // returns: fetched value

    const { [key]: value } = await (localStorage || browser.storage.local).get(
        key,
    )

    if (value === undefined && defVal) {
        return setLocalStorage(key, defVal)
    }
    return value
}

export async function setLocalStorageTyped<
    T extends keyof LocalStorageTypes,
    U extends LocalStorageTypes[T]
>(
    key: T,
    value: U,
    localStorage: Pick<Browser['storage']['local'], 'set'> = null,
): Promise<U> {
    return setLocalStorage(key, value, localStorage)
}

export async function setLocalStorage(
    key,
    value,
    localStorage: Pick<Browser['storage']['local'], 'set'> = null,
) {
    // KEY: (string)
    // value: (any)
    // adds the key, value pair to the storage.local
    // returns: value

    await (localStorage || browser.storage.local).set({
        [key]: value,
    })
    return value
}
