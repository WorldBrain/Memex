export const getLocalStorage = async (KEY, defVal) => {
    // KEY: (string)
    // defVal: (any) default value of the key to set, if undefined
    // gets the value, or if undefined stores it
    // returns: fetched value

    const { [KEY]: value } = await browser.storage.local.get(KEY)

    if (value === undefined && defVal) return await setLocalStorage(KEY, defVal)
    return value
}

export const setLocalStorage = async (KEY, value) => {
    // KEY: (string)
    // value: (any)
    // adds the key, value pair to the storage.local
    // returns: value

    await browser.storage.local.set({
        [KEY]: value,
    })
    return value
}
