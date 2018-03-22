// Limit for the number of search results to be fetched
export const LIMIT = {
    above: 4,
    side: 5,
}

// regex - Regular Expression to match the url
// container - ID of the container to append elements

export const SEARCH_ENGINES = {
    google: {
        regex: /(http[s]?:\/\/)?(www.)?google[.\w]+\/search\?.*/,
        container: {
            above: 'center_col',
            side: 'rhs_block',
        },
    },
}

// Action names
export const OPEN_OVERVIEW = "openOverviewURL"
export const OPEN_OPTIONS = "openOptionsURL"
// Storage keys
export const HIDE_RESULTS_KEY = 'HIDE_MEMEX_RESULTS'
export const SEARCH_INJECTION_KEY = 'SEARCH_INJECTION'
export const POSITION_KEY = 'RESULTS_POSITION_'
