import { SEARCH_ENGINES } from './constants'

export const matchURL = url => {
    // url: (string) location.href 
    // match url against search engines regexs 
    // returns: the search engine it matches to or false

    for (let key in SEARCH_ENGINES) { // eslint-disable-line prefer-const
        const regex = SEARCH_ENGINES[key].regex
        if (url.match(regex) !== null)
            return key
    }
    return false
}

export const fetchQuery = url => {
    // url: (string) location.href 
    // creates a new URL object
    // and fetches the query param from the url
    // returns: query

    const urlObj = new URL(url)
    const query = urlObj.searchParams.get('q')
    return query
}

export const getLocalStorage = async (KEY, defVal) => {
    // KEY: (string) 
    // defVal: (any) default value of the key to set, if undefined
    // gets the value, or if undefined stores it
    // returns: fetched value

    const value = (await browser.storage.local.get(KEY))[KEY]
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
