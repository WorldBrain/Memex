// Constants

// Limit for the number of search results to be fetched
export const LIMIT = {
    above: 4,
    side: 5,
}

// URL for Memex LOGO
export const MEMEX_LOGO_URL = browser.extension.getURL(
    'img/worldbrain-logo-wo-beta.png',
)

// regex - Regular Expression for the search url
// container - ID of the container to append elements

export const SEARCH_ENGINES = {
    google: {
        regex: /(http[s]?:\/\/)?(www.)?google[.\w]+\/search\?.*/,
        container: {
            above: 'ires',
            side: 'rhs_block',
        },
    },
}

// Gets the overview url of the extension
export const OVERVIEW_URL = chrome.extension.getURL('/overview/overview.html')

// Storage keys
export const HIDE_RESULTS_KEY = 'HIDE_MEMEX_RESULTS'
export const SEARCH_INJECTION_KEY = 'SEARCH_INJECTION'
export const POSITION_KEY = 'RESULTS_POSITION_'
