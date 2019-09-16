import { Browser, browser } from 'webextension-polyfill-ts'

export async function getLocalStorage(
    key,
    defVal,
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
