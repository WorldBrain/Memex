import expect from 'expect'
import { parseSearchQuery, constructQueryString } from './logic-filters'
import TEST_DATA from './logic-filters.test.data'

// parsing tests
describe('Search query string parsing', () => {
    for (const { queryString, parsedQuery } of TEST_DATA) {
        it(`Should accurately parse the string "${queryString}" into search terms and filters`, () => {
            const searchDetailArray = parseSearchQuery(queryString)
            if (!parsedQuery) {
                expect(searchDetailArray).toBeNull()
            }
            expect(searchDetailArray).toEqual(parsedQuery)
        })
    }
})

// construct string tests
describe('Search query string parsing', () => {
    for (const { queryString, parsedQuery } of TEST_DATA) {
        it(`Should accurately return the string "${queryString}" from its parsed query array`, () => {
            const constructedString = constructQueryString(parsedQuery)
            if (!constructedString) {
                expect(queryString).toBeNull()
            }
            expect(constructQueryString).toEqual(queryString)
        })
    }
})
