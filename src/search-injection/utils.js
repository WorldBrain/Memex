import { SEARCH_ENGINES, UNWANTED_GOOGLE_SEARCH_TYPES } from './constants'

export const matchURL = url => {
    // url: (string) location.href
    // match url against search engines regexs
    // returns: the search engine it matches to or false

    let matchingKey
    for (const key in SEARCH_ENGINES) {
        if (SEARCH_ENGINES[key].regex.test(url)) {
            matchingKey = key
            break
        }
    }

    if (!matchingKey) {
        return false
    }

    // Google specific fix: `tbm` query param is used to determine google search type (videos, images, etc.)
    // Make sure that it is not set to one of the unwanted types of search
    const searchType = getUrlSearchParams(url).get('tbm')
    if (!UNWANTED_GOOGLE_SEARCH_TYPES.includes(searchType)) {
        return matchingKey
    }

    return false
}

const getUrlSearchParams = url => new URL(url).searchParams

export const fetchQuery = url => {
    // url: (string) location.href
    // creates a new URL object
    // and fetches the query param from the url
    // returns: query

    const searchParams = getUrlSearchParams(url)
    const query = searchParams.get('q')
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
