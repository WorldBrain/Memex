import { VALID_TAG_PATTERN, HASH_TAG_PATTERN } from './constants'

describe('Overview search bar tests', () => {
    it('hashtag regexp should match desired patterns', () => {
        interface TestCase {
            pattern: string
            shouldPass: boolean
        }
        const testCases: TestCase[] = [
            { pattern: '#tag-tag', shouldPass: true },
            { pattern: '#tag.tag', shouldPass: true },
            { pattern: '#tag_tag', shouldPass: true },
            { pattern: '#tag_tag.tag-tag', shouldPass: true },
            { pattern: '#tag', shouldPass: true },
            { pattern: '#tag-', shouldPass: false },
            { pattern: '#tag.', shouldPass: false },
            { pattern: 'tag tag', shouldPass: false },
            { pattern: 'tag', shouldPass: false },
            { pattern: '#', shouldPass: false },
        ]

        for (const { pattern, shouldPass } of testCases) {
            expect([pattern, HASH_TAG_PATTERN.test(pattern)]).toEqual([
                pattern,
                shouldPass,
            ])
        }
    })

    it('tag validity regexp should match desired patterns', () => {
        interface TestCase {
            pattern: string
            shouldPass: boolean
        }
        const testCases: TestCase[] = [
            { pattern: 'tag-tag', shouldPass: true },
            { pattern: 'tag.tag', shouldPass: true },
            { pattern: 'tag_tag', shouldPass: true },
            { pattern: 'tag_tag.tag-tag', shouldPass: true },
            { pattern: 'tag', shouldPass: true },
            { pattern: 'tag-', shouldPass: false },
            { pattern: 'tag.', shouldPass: false },
            { pattern: 'tag tag', shouldPass: false },
        ]

        for (const { pattern, shouldPass } of testCases) {
            expect([pattern, VALID_TAG_PATTERN.test(pattern)]).toEqual([
                pattern,
                shouldPass,
            ])
        }
    })
})
