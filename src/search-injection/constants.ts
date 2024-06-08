import { SearchEngineName, SearchEngineInfo } from './types'

// Limit for the number of search results to be fetched
export const LIMIT = {
    above: 100,
    side: 100,
}

// regex - Regular Expression to match the url
// container - ID of the container to append elements
// containerType - specify what element type the container is

export const SEARCH_ENGINES: {
    [Name in SearchEngineName]: SearchEngineInfo
} = {
    google: {
        regex: /(http[s]?:\/\/)?(www.)?google[.\w]+\/search\?.*/,
        container: {
            above: 'center_col',
            side: 'rhs',
            sideAlternative: 'rcnt',
            featurePreview: 'Odp5De',
            searchList: 'search',
        },
        containerType: 'id',
    },
    duckduckgo: {
        regex: /(http[s]?:\/\/)?(www.)?duckduckgo[.\w]+\/.*?[?&]q=.*/,
        container: {
            above: 'results--main',
            side: 'js-react-sidebar',
        },
        containerType: 'class',
    },
    brave: {
        regex: /(http[s]?:\/\/)?(www.)?brave[.\w]+\/search\?.*/,
        container: {
            above: 'results',
            side: 'side-right',
            sideAlternative: 'rcnt',
        },
        containerType: 'id',
    },
    bing: {
        regex: /(http[s]?:\/\/)?(www.)?bing[.\w]+\/search\?.*/,
        container: {
            above: 'b_results',
            side: 'b_context',
            sideAlternative: 'rcnt',
        },
        containerType: 'id',
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
export const __OLD_HIDE_RESULTS_KEY = 'HIDE_MEMEX_RESULTS'
export const __OLD_SEARCH_INJECTION_KEY = 'SEARCH_INJECTION'
export const __OLD_POSITION_KEY = 'RESULTS_POSITION_'

// Default Search Injection Object
export const SEARCH_INJECTION_DEFAULT = {
    google: true,
    duckduckgo: true,
    brave: true,
    bing: true,
}

export const REACT_ROOTS = {
    youtubeInterface: '__MEMEX-YOUTUBE-INTERFACE-ROOT',
    searchEngineInjection: '__MEMEX-SEARCH-INJECTION-ROOT',
    pdfOpenButtons: '__PDF-OPEN-BUTTONS-INJECTION-ROOT',
    imgActionButtons: '__IMG-ACTION-BUTTONS-INJECTION-ROOT',
}
