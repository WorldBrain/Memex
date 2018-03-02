export const appendCss = filename => {
    const link = document.createElement('link')
    link.type = 'text/css'
    link.rel = 'stylesheet'
    link.href = filename
    document.body.appendChild(link)
}

// Generalized functions to get and store
// variables in browser.storage

export const getLocalStorage = async KEY => {
    const value = (await browser.storage.local.get({
        [KEY]: false,
    }))[KEY]

    return value
}

export const setLocalStorage = async (KEY, value) => {
    return await browser.storage.local.set({
        [KEY]: value,
    })
}
