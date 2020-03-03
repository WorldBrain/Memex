import { registerModuleMapCollections } from '@worldbrain/storex-pattern-modules'

import BookmarksStorage from 'src/bookmarks/background/storage'
import { addBookmark as initAddBookmark } from './bookmarks'
import { PageIndexingBackground } from 'src/page-indexing/background'
import initStorex from 'src/search/memory-storex'

async function setup() {
    const storageManager = initStorex()
    const tabManager = {} as any
    const bookmarksStorage = new BookmarksStorage({ storageManager })

    const fetchPageData = {
        setUrl: undefined,
        process: async (url: string) => {
            fetchPageData.setUrl = url
            return {}
        },
    } as any

    const pages = new PageIndexingBackground({
        bookmarksStorage,
        storageManager,
        fetchPageData,
    })

    registerModuleMapCollections(storageManager.registry, {
        pages: pages.storage,
        bookmarks: bookmarksStorage,
    })

    await storageManager.finishInitialization()

    const addBookmark = initAddBookmark(pages, bookmarksStorage, tabManager)

    return { addBookmark, fetchPageData, pages }
}

describe('src/search/bookmarks tests', () => {
    it('bookmark add should attempt to create a page via XHR if missing and no tab ID provided', async () => {
        const { addBookmark, fetchPageData, pages } = await setup()
        const testUrl = 'test.com'
        const testFullUrl = 'http://test.com'

        await pages.addPage({
            pageDoc: { url: testUrl, content: {} },
            rejectNoContent: false,
        })

        expect(fetchPageData.setUrl).toBeUndefined()

        try {
            await addBookmark({ fullUrl: testFullUrl, url: testUrl })
        } catch (err) {
        } finally {
            expect(fetchPageData.setUrl).toEqual(testFullUrl)
        }
    })
})
