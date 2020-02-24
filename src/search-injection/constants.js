// Limit for the number of search results to be fetched
export const LIMIT = {
    above: 4,
    side: 15,
}

// regex - Regular Expression to match the url
// container - ID of the container to append elements
// containerType - specify what element type the container is

export const SEARCH_ENGINES = {
    google: {
        regex: /(http[s]?:\/\/)?(www.)?google[.\w]+\/search\?.*/,
        container: {
            above: 'center_col',
            side: 'rhs',
        },
        containerType: 'id',
    },
    duckduckgo: {
        regex: /(http[s]?:\/\/)?(www.)?duckduckgo[.\w]+\/\?q=.*/,
        container: {
            above: 'results--main',
            side: 'results--sidebar',
        },
        containerType: 'class',
    },
}

// These are values of the `tbm` query param in Google searches. It denotes
// the type of search performed. More discussion on these:
//   https://productforums.google.com/forum/#!msg/webmasters/8fPg1I2p34w/Xsdw0stkDwAJ
export const UNWANTED_GOOGLE_SEARCH_TYPES = [
    'vid', // Google video
    'nws', // Google news
    'bks', // Google books
    'fin', // Google finance
    'lcl', // Google quick maps
    'isch', // Google images
    'pers', // Google personal
]

// Storage keys
export const HIDE_RESULTS_KEY = 'HIDE_MEMEX_RESULTS'
export const SEARCH_INJECTION_KEY = 'SEARCH_INJECTION'
export const POSITION_KEY = 'RESULTS_POSITION_'

// Default Search Injection Object
export const SEARCH_INJECTION_DEFAULT = {
    google: true,
    duckduckgo: true,
}
