import expect from 'expect'
import { getQueryObjectFromString } from './logic'
import TEST_CASES from './index.test.data'

describe('Search query string parsing', () => {
    for (const { testString, expected } of TEST_CASES) {
        it(`Should accurately parse the string "${testString}" into search terms and filters`, () => {
            const searchDetailArray = getQueryObjectFromString(testString)
            if (!expected) {
                expect(searchDetailArray).toBeNull()
            }
            expect(searchDetailArray).toEqual(expected)
        })
    }
})
