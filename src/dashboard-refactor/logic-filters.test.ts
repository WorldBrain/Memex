import expect from 'expect'
import {
    parseSearchQuery,
    constructQueryString,
    syncQueryStringFilters,
} from './logic-filters'
import TEST_DATA from './logic-filters.test.data'

// parsing tests
describe('Search query string parsion logic', () => {
    for (const { queryString, parsedQuery } of TEST_DATA) {
        if (!parsedQuery) continue
        it(`Should accurately parse the string "${queryString}" into search terms and filters`, () => {
            const searchDetailArray = parseSearchQuery(queryString)
            // if (!parsedQuery) {
            //     expect(searchDetailArray).toBeNull()
            // }
            expect(searchDetailArray).toEqual(parsedQuery)
        })
    }
})

// construct string tests
describe('Search query string construction logic', () => {
    for (const { queryString, parsedQuery } of TEST_DATA) {
        if (!parsedQuery) continue
        it(`Should accurately return the string "${queryString}" from its parsed query array`, () => {
            const constructedString = constructQueryString(parsedQuery)
            if (typeof constructedString === 'undefined') {
                expect(queryString).toBeNull()
            }
            expect(constructedString).toEqual(queryString)
        })
    }
})

// filter mutations
describe('Filter parsing logic', () => {
    for (const { queryString, filtersData } of TEST_DATA) {
        if (!filtersData) {
            continue
        }
        const { newFilterDetail, newQuery } = filtersData
        it(`Should correctly update the query string '${queryString}' to '${newQuery}'`, () => {
            const resultString = syncQueryStringFilters(
                queryString,
                newFilterDetail,
            )
            expect(resultString).toEqual(newQuery)
        })
    }
})

// removing filter key (on picker close)
describe('Filter key removal logic', () => {})
