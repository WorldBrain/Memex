import { SearchFilterDetail, SearchQueryPart } from '../types'

export const addFilterToSearchQuery: (
    filterDetail: SearchFilterDetail,
    queryArray: SearchQueryPart[],
) => SearchQueryPart[] = ({ filterType, filters, rawContent }, queryArray) => {
    // find existing filters object for matching filterType
    const match = queryArray.find(
        (val) => val.detail['filterType'] === filterType,
    )
    if (match) {
        match.detail['filters'].push(filters[0])
        if (match.detail['rawContent']) {
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
        queryArray.push({
            type: 'filter',
            detail: {
                filterType,
                filters,
                rawContent,
            },
        })
    }
    return queryArray
}
