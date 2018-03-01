import { SEARCH_INJECTION_KEY } from '../constants'

export async function fetchSearchInjection() {
    const { searchInjection } = await browser.storage.local.get(
        SEARCH_INJECTION_KEY,
    )
    // For old browsers do typeof searchInjection === "undefined"
    if (searchInjection === undefined) {
        return storeSearchInjection(true)
    }
    return searchInjection
}

async function storeSearchInjection(searchInjection) {
    return browser.storage.local.set({
        [SEARCH_INJECTION_KEY]: searchInjection,
    })
}

export async function toggleSearchInjection() {
    const searchInjection = await fetchSearchInjection()
    const value = searchInjection === false
    return await storeSearchInjection(value)
}
