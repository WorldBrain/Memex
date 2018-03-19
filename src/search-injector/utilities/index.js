import { SEARCH_INJECTION_KEY } from '../constants'

/**
 * fetch searchInjection variable to decide to enable or disable
 * search injection 
 * @returns {boolean} `true` if searchInjection is on and false for vice-versa.
 */
export async function fetchSearchInjection() {
    const { searchInjection } = await browser.storage.local.get(
        SEARCH_INJECTION_KEY,
    )
    // For old browsers do typeof searchInjection === "undefined"
    if (searchInjection === undefined) {
        browser.storage.local.set({
            [SEARCH_INJECTION_KEY]: true,
        })
    }
    return searchInjection
}

/**
 * 
 * @param {string} key fetch Various variables related to search injector state
 * @returns {Promise<array>} returns an empty array on promise resolving
 */
export async function fetchData(key) {
    return await browser.storage.local.get(key)
}

/**
 * 
 * @param {string} key `key` property of search injection like maximize, injection position
 * @param {string} value state of the property mentioned
 */
export async function storeValue(key, value) {
    return browser.storage.local.set({
        [key]: value,
    })
}

/**
 * @returns {Promise<boolean>} `true` if searchInjectio is turned on.
 */

export async function toggleSearchInjection() {
    const searchInjection = await fetchSearchInjection()
    return await storeValue(SEARCH_INJECTION_KEY, !searchInjection)
}
