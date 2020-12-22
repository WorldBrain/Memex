import { SearchFilterDetail, SearchQueryParsed } from '../types'

export const updateSearchQueryArray: (
    filterDetail: SearchFilterDetail,
    queryArray: SearchQueryParsed,
) => SearchQueryParsed = ({ filterType, filters }, queryArray) => {
    // 1. Find detail component of queryArray item with matching filterType
    const match = queryArray.find(
        (val) => val.detail['filterType'] === filterType,
    )
    if (match) {
        match.detail['filters'].push(filters[0])
    } else {
        queryArray.push({
            type: 'filter',
            detail: {
                filterType,
                filters,
            },
        })
    }
    return queryArray
}
