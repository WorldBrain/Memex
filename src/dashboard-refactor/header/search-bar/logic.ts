import {
    VALID_FILTER_STRING_PATTERN,
    SEARCH_QUERY_FILTER_KEY_PATTERN,
    SEARCH_QUERY_FILTER_KEY_PATTERN_G,
    SEARCH_QUERY_END_FILTER_KEY_PATTERN,
} from 'src/dashboard-refactor/constants'
import { FilterList, FilterKey, SearchQueryParsed } from '../types'

interface FilterKeyMapping {
    value: FilterKey
    filter: FilterList
}

const filterKeysMapping: FilterKeyMapping[] = [
    {
        value: 't',
        filter: 'tagsIncluded',
    },
    {
        value: '-t',
        filter: 'tagsExcluded',
    },
    {
        value: 'd',
        filter: 'domainsIncluded',
    },
    {
        value: '-d',
        filter: 'domainsExcluded',
    },
    {
        value: 'c',
        filter: 'listsIncluded',
    },
    {
        value: '-c',
        filter: 'listsExcluded',
    },
    {
        value: 'from',
        filter: 'dateFrom',
    },
    {
        value: 'to',
        filter: 'dateTo',
    },
]

interface FilterKeyMatch {
    filterKey: FilterKey
    isExclusion: boolean
    index: number
}

/**
 * Extracts all valid filter strings from a string.
 * Valid filter strings start with one of 'from:', 'to:', 't:', 'd:', 'c:', '-t:',
 * '-d:', '-c:' and contain a string of alphanumeric characters (with spaces
 * allowed if within double quotes)
 * @param str string from which to extract filter strings
 */

export const getQueryObjectFromString: (str: string) => SearchQueryParsed = (
    str,
) => {
    const filterKeys = getFilterKeys(str)
    if (!filterKeys[0]) {
        return []
    }
    const results: SearchQueryParsed = []

    // separate the string into chunks starting with a valid filter key to find the
    // portion of them which constitutes a valid filter string
    for (let i = filterKeys.length - 1; i >= 0; i--) {
        // chop off last filterkey chunk
        const { filterKey, index } = filterKeys[i]
        const chunk = str.slice(index)
        // reduce copy to exclude new chunk
        str = str.slice(0, index)
        // return array of filters and search terms for chunk and add to beginning of results
        const queryLogic = extractFiltersAndQueryTerms(chunk, filterKey)
        results.unshift(...queryLogic)
    }
    if (filterKeys[0].index > 0) {
        results.unshift({
            type: 'search terms',
            detail: str.trim(),
        })
    }
    return results
}

/**
 * find details of all valid filter keys in a string
 *
 * @param str the query string returned by the onChange event
 * @returns filterKey: string value of the filter key,
 * isExclusion: boolean describing whether key is for an exclusion filter,
 * index: index of the first character of the match
 */

const getFilterKeys: (str: string) => FilterKeyMatch[] = (str) => {
    const reg = SEARCH_QUERY_FILTER_KEY_PATTERN_G
    const arr: FilterKeyMatch[] = []
    const result = str.matchAll(reg)
    let match = result.next()
    let isExclusion: boolean
    while (!match.done) {
        isExclusion = match.value[1][0] === `-`
        arr.push({
            filterKey: match.value[1],
            isExclusion,
            index: match.value.index,
        })
        match = result.next()
    }
    return arr
}

/**
 * Removes section of string from end which is not part of valid filter string and
 * returns it as a string of search queries
 * @param chunk string starting with a valid filter key
 */
const extractFiltersAndQueryTerms: (
    str: string,
    filterKey: FilterKey,
) => SearchQueryParsed = (str, filterKey) => {
    const splitStr = str.split(' ')
    const results: SearchQueryParsed = []
    let searchTerms: string
    for (let j = splitStr.length; j > 0; j--) {
        const slicedSplitStr: string[] = splitStr.slice(0, j)
        searchTerms = splitStr.slice(j).join(' ').trim() // this overwrites until searchTerms contains all non-filter-string space-separated words in the initial string
        const filterString = slicedSplitStr.join(' ')
        if (searchTerms) {
            results.unshift({
                type: 'search terms',
                detail: searchTerms,
            })
        }
        if (filterString.match(VALID_FILTER_STRING_PATTERN)) {
            results.unshift({
                type: 'filter',
                detail: {
                    filterType: filterKeysMapping.find(
                        (obj) => filterKey === obj.value,
                    ).filter,
                    filters: getFilters(filterString),
                },
            })
            return results
        }
    }
    return results
}

/**
 * Extracts individual search filters from a valid filter string
 * @param filterString a valid filter string which returns true when tested against
 * /(,|:)("(.+?)"|[^" ]+?) $/
 */
const getFilters: (filterString: string) => string[] = (filterString) => {
    // remove filter key from string
    const filterKeyMatch = filterString.match(SEARCH_QUERY_FILTER_KEY_PATTERN)
    const trimmedStr = filterString.slice(
        filterKeyMatch.index + filterKeyMatch[0].length,
    )
    const cleanedStr = trimmedStr.replace(/\"|\\\"/g, ``)
    return cleanedStr.split(',').map((str) => str.trim())
}

/**
 * Test string for filter key match.
 * @param str query string from onChange event
 * @returns null or string value of filter key
 */

export const filterKeyTest: (str: string) => string = (str) => {
    const match = str.match(SEARCH_QUERY_END_FILTER_KEY_PATTERN)[1]
    return match[1]
}
