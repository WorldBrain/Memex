import { SEARCH_QUERY_END_FILTER_KEY_PATTERN } from 'src/dashboard-refactor/constants'
import {
    FilterKey,
    SearchFilterType,
    SearchQueryPart,
    QueryFilterPart,
    QueryStringPart,
} from '../types'

// Rules:
// 1. Filter keys
//  a. if character is ':', apply filterKeyTest function.
//      - if returns !false, add SearchFilterDetail object to array
//      - if returns false, continue
//  b. if filter key is found, remove preceding characters and add them to array
// 2. Filter strings
//  a. if filter key detected, pass string to function which:
//      - takes string as param
//      - returns object containing string index and array of valid filters
//      1. loops through string from character after ':'
//      2. sets isInQuotes = true on the first " char and = false on second
//          - if comma first, set to false and discard portion of string
//      3. if comma and !isiInQuotes, add preceding string to array (trimming
//          quotes) then restart with remaining string after the comma
//      4. if space and isInQuotes, continue
//      5. if (space and !isInQuotes) or (end of string and !isInQuotes), add last
//          segment to array of filters and return
//      6. if end of string and isInQuotes, discard section since last comma and
//          return
//  b. if returned index is equal to str.length-1, return array
// 3. Strings
//  a. if parser detects a valid filter key, push preceding str segment into array
//  b. if parser reaches end of string outside of valid filter string, push preceding
//      str segment into array and return

// test strings:
// `foo t:tag,"other tag" c:list,"other `,
// `foo t:tag bar d:foo.com,foobar.com foobar`,

interface FilterKeyMapping {
    key: FilterKey
    filterType: SearchFilterType
    isExclusion?: boolean
    variant?: 'from' | 'to'
}

const mapping: FilterKeyMapping[] = [
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

export const parseSearchQuery: (queryString: string) => SearchQueryPart[] = (
    queryString,
) => {
    const parsedQuery: SearchQueryPart[] = []
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
                pushNewFiltersToArray(
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
                pushNewFiltersToArray(
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
            pushNewFiltersToArray(fragment, parsedQuery)
        } else {
            pushSearchTermToArray(fragment, parsedQuery)
        }
    }

    return parsedQuery
}

const pushNewFiltersToArray: (
    fragment: string,
    parsedQuery: SearchQueryPart[],
) => SearchQueryPart[] = (fragment, parsedQuery) => {
    const filters = parseFilterString(fragment)
    parsedQuery[parsedQuery.length - 1].detail['rawContent'] = fragment
    parsedQuery[parsedQuery.length - 1].detail['filters'].push(...filters)
    return parsedQuery
}

const parseFilterString: (filterString: string) => string[] = (
    filterString,
) => {
    const filters = filterString.replace(/"|\"|\\\"/g, '').split(',')
    return filters
}

const parseFilterKey: (str: string) => SearchQueryPart[] = (str) => {
    const queryParts: SearchQueryPart[] = []
    // test to see if preceding characters form a valid filter key
    const match = str.match(SEARCH_QUERY_END_FILTER_KEY_PATTERN)
    if (match) {
        // remove filter key from end of string
        const precedingStr = str.slice(0, str.length - match[0].length)
        if (precedingStr) {
            pushSearchTermToArray(precedingStr, queryParts)
        }
        // add filter key detail to array
        queryParts.push(getFilterKeyPart(match[1]))
        return queryParts
    }
}

const pushSearchTermToArray: (
    str: string,
    parsedQuery: SearchQueryPart[],
) => SearchQueryPart[] = (str, parsedQuery) => {
    const existingPart =
        parsedQuery[parsedQuery.length - 1]?.type === 'queryString'
            ? parsedQuery[parsedQuery.length - 1]
            : null
    if (existingPart) {
        existingPart.detail['value'] += str
    } else {
        parsedQuery.push({
            type: 'queryString',
            detail: {
                value: str,
            },
        })
    }
    return parsedQuery
}

const getFilterKeyPart: (filterKey: string) => SearchQueryPart = (
    filterKey,
) => {
    const { filterType, isExclusion, variant } = mapping.find(
        (val) => val.key === filterKey,
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
