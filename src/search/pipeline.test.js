/* eslint-env jest */
import pipeline, { extractTerms } from './search-index-new/pipeline'
import * as DATA from './pipeline.test.data'

function testExtractTerms({ input, output = DATA.EXPECTED_TERMS }) {
    const result = extractTerms(input)

    expect(result).toEqual(new Set(output))
}

describe('Search index pipeline', () => {
    test('process a document', async () => {
        const result = await pipeline({
            pageDoc: DATA.PAGE_1,
            bookmarkDocs: [],
            visits: ['12345'],
            rejectNoContent: true,
        })

        expect(result).toEqual(expect.objectContaining(DATA.EXPECTED_OUTPUT))
    })

    test('extract terms from a document', () => {
        testExtractTerms({
            input: 'very often the people forget to optimize important code',
        })
    })

    test('extract terms from a document removing URLs', () => {
        testExtractTerms({
            input:
                'very often the people (https://thepeople.com) forget to optimize important code',
        })
    })

    test('extract terms from a document combining punctuation', () => {
        testExtractTerms({
            input: "very often people's forget to optimize important code",
            output: ['peoples', 'forget', 'optimize', 'important', 'code'],
        })
    })

    test('extract terms from a document removing diacritics', () => {
        testExtractTerms({
            input: 'very often the péople forget to óptimize important code',
        })
    })

    test('extract terms from a document normalizing weird spaces', () => {
        testExtractTerms({
            input:
                'very often\u{2007}the people\u{202F}forget to optimize important\u{A0}code',
        })
    })

    test('extract terms from a document _including_ words with numbers', () => {
        testExtractTerms({
            input:
                'very often the people (like Punkdude123) forget to optimize important code',
            output: [...DATA.EXPECTED_TERMS, 'punkdude123'],
        })
    })

    test('extract terms from a document _including_ emails', () => {
        testExtractTerms({
            input:
                'very often the people (punkdude123@gmail.com) forget to optimize important code',
            output: [...DATA.EXPECTED_TERMS, 'punkdude123@gmail'],
        })
    })

    // https://xkcd.com/37
    test('extract terms from a document _including_ words found in "dash-words"', () => {
        testExtractTerms({
            input:
                'very often the people forget to optimize important-ass code, important-ass-code, and important ass-code',
            output: [
                ...DATA.EXPECTED_TERMS,
                'important-ass-code',
                'important-ass',
                'ass-code',
                'ass',
            ],
        })
    })

    test('extract terms from a document ignoring - spaced - hyphens', () => {
        testExtractTerms({
            input:
                'very   -   often -   the - people forget - to - optimize important code',
            output: DATA.EXPECTED_TERMS,
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

    test('extract terms from a document _including_ words with many consonants', () => {
        testExtractTerms({
            input:
                'very often the people from Vrchlabí forget to optimize important code',
            output: [...DATA.EXPECTED_TERMS, 'vrchlabi'],
        })
    })

    test('extract terms from a document removing duplicate words', () => {
        testExtractTerms({
            input:
                'very often the people forget to people optimize important code',
        })
    })
})
