/* eslint-env jest */

import memdown from 'memdown'
import * as search from './'
import * as index from './search-index'

describe('Search index', () => {
    test('TODO: integration test', async () => {
        index.init({ levelDown: memdown() })
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
            visits: [Date.now().toString()],
        })
        const results = await search.search({
            query: 'fox',
        })
    })
})
