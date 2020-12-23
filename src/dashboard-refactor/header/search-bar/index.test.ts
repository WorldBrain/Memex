import expect from 'expect'
import { parseSearchQuery } from './logic'
import TEST_CASES from './index.test.data'

describe('Search query string parsing', () => {
    for (const { testString, expected } of TEST_CASES) {
        it(`Should accurately parse the string "${testString}" into search terms and filters`, () => {
            const searchDetailArray = parseSearchQuery(testString)
            if (!expected) {
                expect(searchDetailArray).toBeNull()
            }
            expect(searchDetailArray).toEqual(expected)
        })
    }
})
