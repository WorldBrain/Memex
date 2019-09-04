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
import { addTag, delTag, fetchPageTags } from './tags'
import { TabManager } from 'src/activity-logger/background'
import { getPage, grabExistingKeys } from './util'
import { search, getMatchingPageCount, fullSearch } from './search'
import {
    createPageFromTab,
    createPageFromUrl,
    createPageViaBmTagActs,
} from './on-demand-indexing'
import { domainHasFavIcon } from './search/fav-icon'

export function combineSearchIndex(dependenices: {
    getDb: DBGet
    tabManager: TabManager
}): SearchIndex {
    return {
        search: search(dependenices.getDb),
        getMatchingPageCount: getMatchingPageCount(dependenices.getDb),
        fullSearch: fullSearch(dependenices.getDb),
        getPage: getPage(dependenices.getDb),
        addPage: addPage(dependenices.getDb),
        addPageTerms: addPageTerms(dependenices.getDb),
        delPages: delPages(dependenices.getDb),
        delPagesByDomain: delPagesByDomain(dependenices.getDb),
        delPagesByPattern: delPagesByPattern(dependenices.getDb),
        addBookmark: addBookmark(dependenices.getDb, dependenices.tabManager),
        delBookmark: delBookmark(dependenices.getDb, dependenices.tabManager),
        pageHasBookmark: pageHasBookmark(dependenices.getDb),
        updateTimestampMeta: updateTimestampMeta(dependenices.getDb),
        addVisit: addVisit(dependenices.getDb),
        addFavIcon: addFavIcon(dependenices.getDb),
        domainHasFavIcon: domainHasFavIcon(dependenices.getDb),
        addTag: addTag(dependenices.getDb),
        delTag: delTag(dependenices.getDb),
        fetchPageTags: fetchPageTags(dependenices.getDb),
        grabExistingKeys: grabExistingKeys(dependenices.getDb),

        createPageFromTab: createPageFromTab(dependenices.getDb),
        createPageFromUrl: createPageFromUrl(dependenices.getDb),
        createPageViaBmTagActs: createPageViaBmTagActs(dependenices.getDb),

        dangerousPleaseBeSureDeleteAndRecreateDatabase: dangerousPleaseBeSureDeleteAndRecreateDatabase(
            dependenices.getDb,
        ),
    }
}
