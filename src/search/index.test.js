/* eslint-env jest */

import memdown from 'memdown'
import * as search from './'
import * as index from './search-index'

describe('Search index', () => {
    test('TODO: integration test', async () => {
        index.init({ levelDown: memdown() })
        const visit1 = Date.now().toString()
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
            visits: [visit1],
        })
        const { docs: results1 } = await search.search({
            query: 'fox',
            mapResultsFunc: async results => results,
        })
        expect(results1).toEqual([
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
                    visits: new Set([`visit/${visit1}`]),
                    bookmarks: new Set([]),
                    tags: new Set([]),
                    latest: visit1,
                },
            }),
        ]) // TODO: Why is score not deterministic?

        const visit2 = Date.now().toString()
        await search.addPageConcurrent({
            pageDoc: {
                _id: 'test-id-2',
                url: 'https://www.test.com/test2',
                content: {
                    fullText: 'the fox was wild',
                    title: 'test page 2',
                },
            },
            bookmarkDocs: [],
            visits: [visit2],
        })
        const { docs: results2 } = await search.search({
            query: 'fox wild',
            mapResultsFunc: async results => results,
        })
        expect(results2).toEqual([
            expect.objectContaining({
                id: 'test-id-2',
                document: {
                    id: 'test-id-2',
                    terms: new Set(['term/fox', 'term/wild']),
                    urlTerms: new Set([]),
                    titleTerms: new Set(['title/test', 'title/page']),
                    domain: 'domain/test.com',
                    visits: new Set([`visit/${visit2}`]),
                    bookmarks: new Set([]),
                    tags: new Set([]),
                    latest: visit2,
                },
            }),
            expect.objectContaining({
                id: 'test-id-1',
                document: expect.objectContaining({
                    terms: new Set([
                        'term/wild',
                        'term/fox',
                        'term/jumped',
                        'term/hairy',
                        'term/red',
                        'term/hen',
                    ]),
                }),
            }),
        ])

        await search.delPages(['test-id-2'])
        const { docs: results3 } = await search.search({
            query: 'fox wild',
            mapResultsFunc: async results => results,
        })
        expect(results3).toEqual([
            expect.objectContaining({
                id: 'test-id-1',
                document: expect.objectContaining({
                    terms: new Set([
                        'term/wild',
                        'term/fox',
                        'term/jumped',
                        'term/hairy',
                        'term/red',
                        'term/hen',
                    ]),
                }),
            }),
        ])
    })
})
