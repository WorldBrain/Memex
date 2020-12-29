import { SEARCH_QUERY_END_FILTER_KEY_PATTERN } from 'src/dashboard-refactor/constants'
import { FilterKey, SearchFilterType } from './header/types'
import { ParsedSearchQuery, QueryFilterPart, SearchFilterDetail } from './types'

interface FilterKeyMapping {
    key: FilterKey
    filterType: SearchFilterType
    isExclusion?: boolean
    variant?: 'from' | 'to'
}

const filterKeyMapping: FilterKeyMapping[] = [
    {
        key: 't',
        filterType: 'tag',
    },
    {
        key: '-t',
        filterType: 'tag',
        isExclusion: true,
    },
    {
        key: 'd',
        filterType: 'domain',
    },
    {
        key: 'd',
        filterType: 'domain',
        isExclusion: true,
    },
    {
        key: 'c',
        filterType: 'list',
    },
    {
        key: 'c',
        filterType: 'list',
        isExclusion: true,
    },
    {
        key: 'from',
        filterType: 'date',
        variant: 'from',
    },
    {
        key: 'to',
        filterType: 'date',
        variant: 'to',
    },
]

const getFilterMappingFromKey = (filterKey: string): FilterKeyMapping => {
    return filterKeyMapping.find((val) => val.key === filterKey)
}

const getFilterKeyPart: (filterKey: string) => QueryFilterPart = (
    filterKey,
) => {
    const { filterType, isExclusion, variant } = getFilterMappingFromKey(
        filterKey,
    )
    const queryFilterPart: QueryFilterPart = {
        type: 'filter',
        detail: {
            filterType,
            filters: [],
            rawContent: '',
        },
    }
    if (isExclusion) {
        queryFilterPart.detail['isExclusion'] = true
    }
    if (variant) {
        queryFilterPart.detail['variant'] = variant
    }
    return queryFilterPart
}

const pushSearchStringToArray: (
    str: string,
    parsedQuery: ParsedSearchQuery,
) => ParsedSearchQuery = (str, parsedQuery) => {
    const existingPart =
        parsedQuery[parsedQuery.length - 1]?.type === 'searchString'
            ? parsedQuery[parsedQuery.length - 1]
            : null
    if (existingPart) {
        existingPart.detail['value'] += str
    } else {
        parsedQuery.push({
            type: 'searchString',
            detail: {
                value: str,
            },
        })
    }
    return parsedQuery
}

const parseFilterString: (filterString: string) => string[] = (
    filterString,
) => {
    const filters = filterString.replace(/"|\"|\\\"/g, '').split(',')
    return filters
}

const parseFilterKey: (str: string) => ParsedSearchQuery = (str) => {
    const queryParts: ParsedSearchQuery = []
    // test to see if preceding characters form a valid filter key
    const match = str.match(SEARCH_QUERY_END_FILTER_KEY_PATTERN)
    if (match) {
        // remove filter key from end of string
        const precedingStr = str.slice(0, str.length - match[0].length)
        if (precedingStr) {
            pushSearchStringToArray(precedingStr, queryParts)
        }
        // add filter key detail to array
        queryParts.push(getFilterKeyPart(match[1]))
        return queryParts
    }
}

const pushFiltersToArray: (
    fragment: string,
    parsedQuery: ParsedSearchQuery,
    containsFilterQuery: boolean,
) => ParsedSearchQuery = (fragment, parsedQuery) => {
    const filters = parseFilterString(fragment)
    if (containsFilterQuery) {
    }
    parsedQuery[parsedQuery.length - 1].detail['rawContent'] = fragment
    parsedQuery[parsedQuery.length - 1].detail['filters'].push(...filters)
    return parsedQuery
}

/**
 * Takes a query string and returns an array of objects split into the relevant parts
 * of the query
 * @param queryString
 */
export const parseSearchQuery: (queryString: string) => ParsedSearchQuery = (
    queryString,
) => {
    const parsedQuery: ParsedSearchQuery = []
    // define var to hold unprocessed part of string
    let fragment: string = ''
    // define control booleans
    let isInFilterStr: boolean
    let isInQuotes: boolean
    let followsClosingQuote: boolean
    for (let i = 0; i < queryString.length; i++) {
        const char = queryString[i]
        fragment += char

        // this code ensures that a filter string ends after quotes if a non-comma char is detected
        if (followsClosingQuote) {
            followsClosingQuote = false
            if (char === ',') {
                continue
            } else {
                pushFiltersToArray(
                    fragment.slice(0, fragment.length - 1),
                    parsedQuery,
                )
                fragment = fragment[fragment.length - 1]
                isInFilterStr = false
                continue
            }
        }

        // if in filter string, apply relevant rules
        if (isInFilterStr) {
            if (char === '"') {
                if (isInQuotes) {
                    followsClosingQuote = true
                }
                isInQuotes = !isInQuotes
                continue
            }
            if (isInQuotes && char === ',') {
                isInQuotes = !isInQuotes
                continue
            }
            if (char === ' ') {
                if (isInQuotes) {
                    continue
                }
                // extract filters from fragment and push into array
                // note the fragment is altered here in order to ensure the whiteSpace is counted as searchTerm and not appended to a filter
                pushFiltersToArray(
                    fragment.slice(0, fragment.length - 1),
                    parsedQuery,
                )
                fragment = fragment[fragment.length - 1]
                // this is the place to emit any mutations to close state pickers
                isInFilterStr = false
                continue
            }
        }

        // check for filter key completion
        if (!isInFilterStr && char === ':') {
            const filterKeyParts = parseFilterKey(fragment)
            if (filterKeyParts) {
                // this is the place to perform any state mutations to open pickers
                parsedQuery.push(...filterKeyParts)
                isInFilterStr = true
                fragment = ''
                continue
            }
        }
    }

    // run steps for string end
    if (fragment) {
        if (isInFilterStr) {
            pushFiltersToArray(fragment, parsedQuery, true)
        } else {
            pushSearchStringToArray(fragment, parsedQuery)
        }
    }

    return parsedQuery
}

/**
 * Constructs a query string (of type string) from an array of type ParsedSearchQuery.
 * The inverse of the parseSearchQuery function.
 * @param parsedQuery an array of type ParsedSearchQuery
 */
export const constructQueryString = (
    parsedQuery: ParsedSearchQuery,
): string => {
    let queryString: string = ''
    return parsedQuery.reduce((queryString, currentPart) => {
        if (currentPart.type === 'filter') {
            // find mapped filter key and append to string
            const key = getFilterKeyFromDetail(currentPart.detail)
            const { variant, rawContent } = currentPart.detail
            queryString += `${key}:${rawContent}`
            if (variant) {
                queryString += `${variant}:`
            } else {
                queryString += `${key}:`
            }
        } else {
            // else append string value
            queryString += currentPart.detail.value
        }
        return queryString
    }, queryString)
}

const getFilterKeyFromDetail = (filterDetail: SearchFilterDetail): string => {
    const { filterType, isExclusion, variant } = filterDetail
    return filterKeyMapping.find(
        (val) =>
            val.filterType === filterType &&
            (variant ? val.variant === variant : true) &&
            (isExclusion ? val.isExclusion === isExclusion : true),
    ).key
}

const findMatchingFilterPartIndex = (
    { filterType, isExclusion, variant }: SearchFilterDetail,
    parsedQuery: ParsedSearchQuery,
): number => {
    const index = parsedQuery.findIndex(
        (val) =>
            val.detail['filterType'] === filterType &&
            (variant ? val.detail['variant'] === variant : true) &&
            (isExclusion ? val.detail['isExclusion'] === isExclusion : true),
    )
    return index
}

const getFilterPartFromKey = (filterKey: string): QueryFilterPart => {
    const { filterType, variant, isExclusion } = getFilterMappingFromKey(
        filterKey,
    )
    const filterPart: QueryFilterPart = {
        type: 'filter',
        detail: {
            filterType,
            filters: [],
            rawContent: '',
        },
    }
    if (variant) {
        filterPart.detail['variant'] = variant
    }
    if (isExclusion) {
        filterPart.detail['isExclusion'] = isExclusion
    }
    return filterPart
}

const getRawContentFromFiltersArray = (filtersArray: string[]): string => {
    let rawContent: string = ''
    filtersArray.forEach((filter, index, arr) => {
        if (/\s/.test(filter)) {
            rawContent += `"${filter}"`
        } else {
            rawContent += filter
        }
        if (arr[index + 1]) {
            rawContent += ','
        }
    })
    return rawContent
}

/**
 * takes query string and object specifying detail of filter key to be added and returns
 * correctly formatted query string
 * @param filterPart
 * @param queryString
 */
export const pushFilterKeyToQueryString = (
    filterDetail: SearchFilterDetail,
    queryString: string,
): string => {
    const parsedQuery = parseSearchQuery(queryString)
    // ensure that if the queryString is not empty a whitespace precedes the filter part
    if (parsedQuery.length > 0) {
        const lastItem = parsedQuery[parsedQuery.length - 1]
        if (lastItem.type === 'searchString') {
            const lastItemValue = lastItem.detail.value
            if (lastItemValue[lastItemValue.length - 1] !== ' ') {
                lastItem.detail.value += ' '
            }
        } else {
            pushSearchStringToArray(' ', parsedQuery)
        }
    }
    const filterKey = getFilterKeyFromDetail(filterDetail)
    const filterKeyPart = getFilterPartFromKey(filterKey)
    parsedQuery.push(filterKeyPart)
    return constructQueryString(parsedQuery)
}

/**
 * Takes query string and an object specifying the filter to be added and
 * returns the correctly formatted query string
 * @param queryString
 * @param filterPart
 */
export const insertFilterToQueryString = (
    filterDetail: SearchFilterDetail,
    queryString: string,
): string => {
    const parsedQuery = parseSearchQuery(queryString)
    const targetPart =
        parsedQuery[findMatchingFilterPartIndex(filterDetail, parsedQuery)]
    targetPart.detail['filters'].push(...filterDetail.filters)
    targetPart.detail['rawContent'] = getRawContentFromFiltersArray(
        filterDetail.filters,
    )
    return constructQueryString(parsedQuery)
}
