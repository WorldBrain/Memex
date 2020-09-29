import { DBGet, SearchIndex } from './types'
import { addBookmark, delBookmark } from './bookmarks'
// import { addTag, delTag, fetchPageTags } from './tags'
import { TabManager } from 'src/activity-logger/background'
import { search, getMatchingPageCount, fullSearch } from './search'
import BookmarksStorage from 'src/bookmarks/background/storage'
import { getPage } from './models/page'
import { PageIndexingBackground } from 'src/page-indexing/background'

export function combineSearchIndex(dependenices: {
    pages: PageIndexingBackground
    bookmarksStorage: BookmarksStorage
    getDb: DBGet
    tabManager: TabManager
}): SearchIndex {
    const pageStorage = dependenices.pages.storage

    return {
        search: search(dependenices.getDb),
        getMatchingPageCount: getMatchingPageCount(dependenices.getDb),
        fullSearch: fullSearch(dependenices.getDb),
        getPage: getPage(dependenices.getDb),

        addBookmark: addBookmark(
            dependenices.pages,
            dependenices.bookmarksStorage,
            dependenices.tabManager,
        ),
        delBookmark: delBookmark(
            pageStorage,
            dependenices.bookmarksStorage,
            dependenices.tabManager,
        ),
    }
}
