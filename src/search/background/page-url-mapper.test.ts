import Storex from '@worldbrain/storex'

import * as DATA from './page-url-mapper.test.data'
import { PageUrlMapperPlugin } from './page-url-mapper'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'

describe('Page URL Mapper storex plugin', () => {
    async function setupTest() {
        const { storageManager } = await setupBackgroundIntegrationTest()

        return { storageManager }
    }

    const findMatchingPages: (
        s: Storex,
    ) => typeof PageUrlMapperPlugin.prototype.findMatchingPages = (man) => (
        ...args
    ) => man.operation(PageUrlMapperPlugin.MAP_OP_ID, ...args)

    /*
        This test came about as we noticed bookmarked pages would lose their bookmark status
        in search results, only during terms search. Non-terms searches would set the bookmark
        status correctly.
        https://www.notion.so/worldbrain/using-keywords-and-bookmark-filter-does-not-show-bookmark-icon-in-result-list-047017dfde734dd1a5444340e230b125
     */
    it('found pages should be exactly the same for both terms and non-terms search cases when searched terms available in all results', async () => {
        const { storageManager } = await setupTest()

        // Set up 3 visited pages, 2 of which are bookmarked
        await storageManager.collection('pages').createObject(DATA.PAGE_1)
        await storageManager
            .collection('visits')
            .createObject({ url: DATA.PAGE_1.url, time: DATA.VISIT_1 })
        await storageManager
            .collection('bookmarks')
            .createObject({ url: DATA.PAGE_1.url, time: DATA.BOOKMARK_1 })

        await storageManager.collection('pages').createObject(DATA.PAGE_2)
        await storageManager
            .collection('visits')
            .createObject({ url: DATA.PAGE_2.url, time: DATA.VISIT_2 })
        await storageManager
            .collection('bookmarks')
            .createObject({ url: DATA.PAGE_2.url, time: DATA.BOOKMARK_2 })

        await storageManager.collection('pages').createObject(DATA.PAGE_3)
        await storageManager
            .collection('visits')
            .createObject({ url: DATA.PAGE_3.url, time: DATA.VISIT_3 })

        // Simulates non-terms search
        const nonTermsSearchResults = await findMatchingPages(storageManager)(
            [DATA.PAGE_1.url, DATA.PAGE_2.url, DATA.PAGE_3.url],
            { base64Img: true },
        )

        // Simulates terms search (latest times already retrieved in search process)
        const termsSearchResults = await findMatchingPages(storageManager)(
            [DATA.PAGE_1.url, DATA.PAGE_2.url, DATA.PAGE_3.url],
            {
                base64Img: true,
                latestTimes: [DATA.BOOKMARK_1, DATA.BOOKMARK_2, DATA.VISIT_3],
            },
        )

        expect(termsSearchResults).toEqual(nonTermsSearchResults)
    })
})
