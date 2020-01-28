import { DBGet, SearchIndex } from './types'
import {
    addPage,
    addPageTerms,
    updateTimestampMeta,
    addVisit,
    addFavIcon,
} from './add'
import {
    delPages,
    delPagesByDomain,
    delPagesByPattern,
    dangerousPleaseBeSureDeleteAndRecreateDatabase,
} from './del'
import { addBookmark, delBookmark, pageHasBookmark } from './bookmarks'
// import { addTag, delTag, fetchPageTags } from './tags'
import { TabManager } from 'src/activity-logger/background'
import { search, getMatchingPageCount, fullSearch } from './search'
import {
    createPageFromTab,
    createPageFromUrl,
    createPageViaBmTagActs,
    createTestPage,
} from './on-demand-indexing'
import { domainHasFavIcon } from './search/fav-icon'
import PageStorage from 'src/page-indexing/background/storage'
import BookmarksStorage from 'src/bookmarks/background/storage'
import { getPage } from './models/page'

export function combineSearchIndex(dependenices: {
    pageStorage: PageStorage
    bookmarksStorage: BookmarksStorage
    getDb: DBGet
    tabManager: TabManager
}): SearchIndex {
    return {
        search: search(dependenices.getDb),
        getMatchingPageCount: getMatchingPageCount(dependenices.getDb),
        fullSearch: fullSearch(dependenices.getDb),
        getPage: getPage(dependenices.getDb),
        addPage: addPage(
            dependenices.pageStorage,
            dependenices.bookmarksStorage,
        ),
        addPageTerms: addPageTerms(dependenices.pageStorage),
        delPages: delPages(dependenices.getDb),
        delPagesByDomain: delPagesByDomain(dependenices.getDb),
        delPagesByPattern: delPagesByPattern(dependenices.getDb),
        addBookmark: addBookmark(
            dependenices.pageStorage,
            dependenices.bookmarksStorage,
            dependenices.tabManager,
        ),
        delBookmark: delBookmark(
            dependenices.pageStorage,
            dependenices.bookmarksStorage,
            dependenices.tabManager,
        ),
        pageHasBookmark: pageHasBookmark(dependenices.bookmarksStorage),
        updateTimestampMeta: updateTimestampMeta(dependenices.pageStorage),
        addVisit: addVisit(dependenices.pageStorage),
        addFavIcon: addFavIcon(dependenices.pageStorage),
        domainHasFavIcon: domainHasFavIcon(dependenices.getDb),

        createPageFromTab: createPageFromTab(dependenices.pageStorage),
        createPageFromUrl: createPageFromUrl(dependenices.pageStorage),
        createPageViaBmTagActs: createPageViaBmTagActs(
            dependenices.pageStorage,
        ),
        createTestPage: createTestPage(dependenices.pageStorage),

        dangerousPleaseBeSureDeleteAndRecreateDatabase: dangerousPleaseBeSureDeleteAndRecreateDatabase(
            dependenices.getDb,
        ),
    }
}
