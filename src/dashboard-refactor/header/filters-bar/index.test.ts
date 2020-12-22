import expect from 'expect'
import { updateSearchQueryArray } from './logic'
import TEST_CASES from './index.test.data'

describe('Search query string parsing', () => {
    for (let i = 0; i < TEST_CASES.length; i++) {
        it(`Should accurately parse test case ${i} into search terms and filters`, () => {
            const { newFilterObj, oldQueryArray, newQueryArray } = TEST_CASES[i]
            const result = updateSearchQueryArray(newFilterObj, oldQueryArray)
            expect(result).toEqual(newQueryArray)
        })
    }
})
