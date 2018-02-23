// Constants

// Limit for the number of search results to be fetched
export const LIMIT = 5

// regex - Regular Expression for the search url
// container - ID of the container to append elements

export const SEARCH_ENGINES = {
    google: {
        regex: /(http[s]?:\/\/)?(www.)?google[.\w]+\/search\?.*/,
        container: 'ires',
    },
}
