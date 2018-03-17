export const appendCss = filename => {
    const link = document.createElement('link')
    link.type = 'text/css'
    link.rel = 'stylesheet'
    link.href = filename
    const d = document.body || document.head || document.documentElement
    d.prepend(link)
}

// Generalized functions to get and store
// variables in browser.storage.local

export const getLocalStorage = async (KEY, defVal = '') => {
    // defVal: Default value of the key to set, when key has not been set
    const value = (await browser.storage.local.get(KEY))[KEY]
    if (value === undefined) return await setLocalStorage(KEY, defVal)
    return value
}

export const setLocalStorage = async (KEY, value) => {
    await browser.storage.local.set({
        [KEY]: value,
    })
    return value
}
