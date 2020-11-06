import { DBGet, SearchIndex } from './types'
import { search, getMatchingPageCount, fullSearch } from './search'
import { getPage } from './models/page'

export function combineSearchIndex(dependenices: {
    getDb: DBGet
}): SearchIndex {
    return {
        search: search(dependenices.getDb),
        getMatchingPageCount: getMatchingPageCount(dependenices.getDb),
        fullSearch: fullSearch(dependenices.getDb),
        getPage: getPage(dependenices.getDb),
    }
}
