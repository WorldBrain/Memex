import { DBGet, SearchIndex } from './types'
import { addBookmark, delBookmark, pageHasBookmark } from './bookmarks'
// import { addTag, delTag, fetchPageTags } from './tags'
import { TabManager } from 'src/activity-logger/background'
import { search, getMatchingPageCount, fullSearch } from './search'
import BookmarksStorage from 'src/bookmarks/background/storage'
import { getPage } from './models/page'
import { PageIndexingBackground } from 'src/page-indexing/background'
import { bindMethod } from 'src/util/functions'

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
        addPage: bindMethod(dependenices.pages, 'addPage'),
        addPageTerms: bindMethod(dependenices.pages, 'addPageTerms'),
        delPages: bindMethod(dependenices.pages, 'delPages'),
        delPagesByDomain: bindMethod(dependenices.pages, 'delPagesByDomain'),
        delPagesByPattern: bindMethod(dependenices.pages, 'delPagesByPattern'),
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
        pageHasBookmark: pageHasBookmark(dependenices.bookmarksStorage),
        updateTimestampMeta: bindMethod(
            dependenices.pages,
            'updateTimestampMeta',
        ),
        addVisit: bindMethod(dependenices.pages, 'addVisit'),
        addFavIcon: bindMethod(dependenices.pages, 'addFavIcon'),
        domainHasFavIcon: bindMethod(dependenices.pages, 'domainHasFavIcon'),

        createPageFromTab: bindMethod(dependenices.pages, 'createPageFromTab'),
        createPageFromUrl: bindMethod(dependenices.pages, 'createPageFromUrl'),
        createPageViaBmTagActs: bindMethod(
            dependenices.pages,
            'createPageViaBmTagActs',
        ),
        createTestPage: bindMethod(dependenices.pages, 'createTestPage'),
    }
}
