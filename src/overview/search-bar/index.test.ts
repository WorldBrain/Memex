import {
    VALID_TAG_PATTERN,
    HASH_TAG_PATTERN,
} from '@worldbrain/memex-common/lib/storage/constants'

import { SEARCH_INPUT_SPLIT_PATTERN } from './constants'

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
            { pattern: '#"tag tag"', shouldPass: true },
            { pattern: '#"tag tag tag"', shouldPass: true },
            { pattern: '#"tag tag tag tag"', shouldPass: true },
            { pattern: '#tag tag"', shouldPass: false },
            { pattern: '#tag-', shouldPass: false },
            { pattern: '#tag.', shouldPass: false },
            { pattern: '#tag"', shouldPass: false },
            { pattern: '#"tag', shouldPass: false },
            { pattern: 'tag', shouldPass: false },
            { pattern: '#', shouldPass: false },
        ]

        for (const { pattern, shouldPass } of testCases) {
            expect([pattern, HASH_TAG_PATTERN.test(pattern)]).toEqual([
                pattern,
                shouldPass,
            ])

            // For the valid patterns, also test their inverse negated hashtag syntax
            if (shouldPass) {
                const negatedPattern = `-${pattern}`
                expect([
                    negatedPattern,
                    HASH_TAG_PATTERN.test(negatedPattern),
                ]).toEqual([negatedPattern, shouldPass])
            }
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
            { pattern: 'tag tag', shouldPass: true },
            { pattern: 'tag tag tag', shouldPass: true },
            { pattern: 'tag tag tag tag', shouldPass: true },
            { pattern: 'tag', shouldPass: true },
            { pattern: 'tag-', shouldPass: false },
            { pattern: 'tag.', shouldPass: false },
        ]

        for (const { pattern, shouldPass } of testCases) {
            expect([pattern, VALID_TAG_PATTERN.test(pattern)]).toEqual([
                pattern,
                shouldPass,
            ])
        }
    })

    it('search input terms split regexp should match desired patterns', () => {
        interface TestCase {
            input: string
            terms: string[]
        }

        const testCases: TestCase[] = [
            {
                input: 'term #tag #"test tag" ok',
                terms: ['term', '#tag', '#"test tag"', 'ok'],
            },
            {
                input: 'term term term term',
                terms: ['term', 'term', 'term', 'term'],
            },
            {
                input: 'term -#term site:test.com',
                terms: ['term', '-#term', 'site:test.com'],
            },
            {
                input: 'term -#term site:test.com -#"test tag"',
                terms: ['term', '-#term', 'site:test.com', '-#"test tag"'],
            },
            {
                input: 'term -#"tag tag tag" #"tag tag tag"',
                terms: ['term', '-#"tag tag tag"', '#"tag tag tag"'],
            },
            // Missing prefixed quotation mark
            {
                input: 'term -#tag tag tag" #"tag tag tag tag"',
                terms: ['term', '-#tag', 'tag', 'tag"', '#"tag tag tag tag"'],
            },
            // Missing postfixed quotation mark
            {
                input: 'term -#"tag tag tag #"tag tag tag tag"',
                terms: ['term', '-#"tag', 'tag', 'tag', '#"tag tag tag tag"'],
            },
            {
                input: 'term -#"tag tag tag" #"tag tag tag tag"',
                terms: ['term', '-#"tag tag tag"', '#"tag tag tag tag"'],
            },
            {
                input: 'term #"tag-tag tag" #"tag.tag tag" #"tag tag_tag"',
                terms: [
                    'term',
                    '#"tag-tag tag"',
                    '#"tag.tag tag"',
                    '#"tag tag_tag"',
                ],
            },
            {
                input: 'term -#"tag" #"tag"',
                terms: ['term', '-#"tag"', '#"tag"'],
            },
        ]

        for (const { input, terms } of testCases) {
            expect([input, input.match(SEARCH_INPUT_SPLIT_PATTERN)]).toEqual([
                input,
                terms,
            ])
        }
    })
})
