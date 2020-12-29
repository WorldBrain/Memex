import { SearchFilterDetail, SearchQueryPart, QueryFilterPart } from '../types'

export const addFilterToSearchQuery: (
    filterDetail: SearchFilterDetail,
    queryArray: SearchQueryPart[],
) => SearchQueryPart[] = (
    { filterType, filters, rawContent, variant, isExclusion },
    queryArray,
) => {
    // find existing filters object for matching filterType (and variant and exclusion if they exist)
    const match = queryArray.find(
        (val) =>
            val.detail['filterType'] === filterType &&
            (variant ? val.detail['variant'] === variant : true) &&
            (isExclusion ? val.detail['isExclusion'] === isExclusion : true),
    )
    if (match) {
        match.detail['filters'].push(filters[0])
        if (match.detail['rawContent']) {
            if (match.detail['lastFilterIncompleteQuote']) {
                delete match.detail['lastFilterIncompleteQuote']
                match.detail['rawContent'] += `"`
            }
            match.detail['rawContent'] += `,`
        }
        match.detail['rawContent'] += rawContent
    } else {
        // if no matching filter object, check for preceding string part then push a new filters object
        if (queryArray.length) {
            // if array has at least one item, ensure that the last item, if a searchTerm, ends with a space
            const { type, detail } = queryArray[queryArray.length - 1]
            let value = detail['value']
            if (type === 'queryString' && value[value.length] !== ' ') {
                detail['value'] += ' '
            }
        }
        const filterObj: QueryFilterPart = {
            type: 'filter',
            detail: {
                filterType,
                filters,
                rawContent,
            },
        }
        if (variant) {
            filterObj.detail['variant'] = variant
        }
        if (isExclusion) {
            filterObj.detail['isExclusion'] = isExclusion
        }
        queryArray.push(filterObj)
    }
    return queryArray
}
