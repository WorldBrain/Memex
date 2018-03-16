/* eslint-env jest */

import newPipeline from './search-index-new/pipeline'
import oldPipeline, { extractTerms } from './search-index-old/pipeline'
import * as DATA from './pipeline.test.data'

const runSuite = useOld => () => {
    // New index pipeline has removed unused visit, bookmark inputs and removed all IDB key prefixing ('term/')
    const pipeline = useOld ? oldPipeline : newPipeline
    const attachPrefix = useOld ? s => 'term/' + s : s => s

    function testExtractTerms({ input, output = DATA.EXPECTED_TERMS }) {
        const result = extractTerms(input, useOld ? 'term' : undefined)

        expect(result).toEqual(new Set(output.map(attachPrefix)))
    }

    test('process a document', async () => {
        const result = await pipeline({
            pageDoc: DATA.PAGE_1,
            bookmarkDocs: [],
            visits: ['12345'],
            rejectNoContent: true,
        })

        // Pipeline outputs differently in both implementations too as pages now contain additional data
        //  that was prev. in Pouch (Pouch docs never went through pipeline - weird design).
        const expected = useOld
            ? DATA.EXPECTED_OUTPUT_OLD
            : DATA.EXPECTED_OUTPUT_NEW

        expect(result).toEqual(expect.objectContaining(expected))
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

    test('extract terms from a document normalizing weird spaces', () => {
        testExtractTerms({
            input:
                'very often\u{2007}the people\u{202F}forget to optimize important\u{A0}code',
        })
    })

    test('extract terms from a document _including_ words with numbers', () => {
        testExtractTerms({
            input:
                'very often the-people (like Punkdude123) forget to optimize important code',
            output: [...DATA.EXPECTED_TERMS, 'punkdude123'],
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
}

describe('Old search index pipeline', runSuite(true))
describe('New search index pipeline', runSuite(false))
