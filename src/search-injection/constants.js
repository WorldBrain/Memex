// Constants

// Limit for the number of search results to be fetched
export const LIMIT = 3

// ID for the container to be injected
export const MEMEX_CONTAINER_ID = 'MemexResults'

// regex - Regular Expression for the search url
// container - ID of the container to append elements

export const SEARCH_ENGINES = {
    google: {
        regex: /(http[s]?:\/\/)?(www.)?google[.\w]+\/search\?.*/,
        container: 'ires',
    },
}

// Gets the overview url of the extension
export const OVERVIEW_URL = chrome.runtime.getURL('/overview/overview.html')

// Local storage for hideResults state
export const LOCALSTORAGE_ID = 'HIDE_MEMEX_RESULTS'
