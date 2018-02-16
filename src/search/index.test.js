/* eslint-env jest */

import memdown from 'memdown'
import * as search from './'
import * as index from './search-index'

describe('Search index', () => {
    test('TODO: integration test', async () => {
        index.init({ levelDown: memdown() })
        const visit = Date.now().toString()
        await search.addPageConcurrent({
            pageDoc: {
                _id: 'test-id-1',
                url: 'https://www.test.com/test',
                content: {
                    fullText: 'the wild fox jumped over the hairy red hen',
                    title: 'test page',
                },
            },
            bookmarkDocs: [],
            visits: [visit],
        })
        const { docs: results } = await search.search({
            query: 'fox',
            mapResultsFunc: async results => results,
        })
        expect(results).toEqual([
            expect.objectContaining({
                id: 'test-id-1',
                document: {
                    id: 'test-id-1',
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
                    visits: new Set([`visit/${visit}`]),
                    bookmarks: new Set([]),
                    tags: new Set([]),
                    latest: visit,
                },
            }),
        ]) // TODO: Why is score not deterministic?
    })
})
