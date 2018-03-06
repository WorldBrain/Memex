/* eslint-env jest */

import pipeline, { extractTerms } from './pipeline'

const TEST_EXTRACT_OUTPUT = new Set([
    'term/people',
    'term/forget',
    'term/optimize',
    'term/important',
    'term/code',
])
function testExtractTerms({ input, output }) {
    const result = extractTerms(input, 'term')
    expect(result).toEqual(
        output ? new Set(output.map(s => 'term/' + s)) : TEST_EXTRACT_OUTPUT,
    )
}

describe('Search index pipeline', () => {
    test('process a document', async () => {
        const result = await pipeline({
            pageDoc: {
                url: 'https://www.test.com/test',
                content: {
                    fullText: 'the wild fox jumped over the hairy red hen',
                    title: 'test page',
                },
            },
            bookmarkDocs: [],
            visits: ['12345'],
            rejectNoContent: true,
        })
        expect(result).toEqual(
            expect.objectContaining({
                terms: new Set([
                    'term/wild',
                    'term/fox',
                    'term/jumped',
                    'term/hairy',
                    'term/red',
                    'term/hen',
                ]),
                urlTerms: new Set(['url/test']),
                titleTerms: new Set(['title/test', 'title/page']),
                domain: 'domain/test.com',
                visits: new Set(['visit/12345']),
                bookmarks: new Set(),
                tags: new Set(),
            }),
        )
    })

    test('extract terms from a document', () => {
        testExtractTerms({
            input: 'very often the people forget to optimize important code',
        })
    })

    test('extract terms from a document removing URLs', () => {
        testExtractTerms({
            input:
                'very often the people (https://the-people.com) forget to optimize important code',
        })
    })

    test('extract terms from a document combining punctuation', () => {
        testExtractTerms({
            input: "very often people's forget to optimize important code",
            output: ['peoples', 'forget', 'optimize', 'important', 'code'],
        })
    })

    test('extract terms from a document splitting punctuation', () => {
        testExtractTerms({
            input: 'very often the-people forget to optimize important code',
        })
    })

    test('extract terms from a document removing diacritics', () => {
        testExtractTerms({
            input: 'very often the-péople forget to óptimize important code',
        })
    })

    test('extract terms from a document removing words with numbers', () => {
        testExtractTerms({
            input:
                'very often the-people (like Punkdude123) forget to optimize important code',
        })
    })

    test('extract terms from a document removing useless whitespace', () => {
        testExtractTerms({
            input: 'very often the people forget to optimize important code',
        })
    })

    test('extract terms from a document removing random digits', () => {
        testExtractTerms({
            input: 'very often the 5 people forget to optimize important code',
        })
        testExtractTerms({
            input:
                'very often the 555 people forget to optimize important code',
        })
        testExtractTerms({
            input:
                'very often the 5555 people forget to optimize important code',
            output: [
                '5555',
                'people',
                'forget',
                'optimize',
                'important',
                'code',
            ],
        })
        testExtractTerms({
            input:
                'very often the 555555 people forget to optimize important code',
        })
    })

    test('extract terms from a document removing long words', () => {
        testExtractTerms({
            input:
                'very often the hippopotomonstrosesquippedaliophobic people forget to optimize important code',
        })
    })

    test('FIX for Slavic languages: extract terms from a document removing words with too many consonants', () => {
        testExtractTerms({
            input:
                'very often the people from Vrchlabí forget to optimize important code',
        })
    })

    test('extract terms from a document removing duplicate words', () => {
        testExtractTerms({
            input:
                'very often the people forget to people optimize important code',
        })
    })
})
