import * as newBackend from './search-index-new'

export class SearchIndex {
    /**
     * Denotes which backend to use; either the old LevelUP-based
     * or the new Dexie-based implementation. Can be set from outside.
     */
    useOld: boolean

    constructor(useOld?: boolean) {
        this.useOld = false
    }

    private get backend(): typeof newBackend {
        return newBackend
    }

    private bindIndexMethod = (name: string) => (...args) =>
        this.backend[name](...args)

    // Adding stuff
    addPage = this.bindIndexMethod('addPage')
    addPageTerms = this.bindIndexMethod('addPageTerms')
    updateTimestampMeta = this.bindIndexMethod('updateTimestampMeta')
    addVisit = this.bindIndexMethod('addVisit')
    addFavIcon = this.bindIndexMethod('addFavIcon')

    // Deleting stuff
    delPages = this.bindIndexMethod('delPages')
    delPagesByDomain = this.bindIndexMethod('delPagesByDomain')
    delPagesByPattern = this.bindIndexMethod('delPagesByPattern')

    // Tags
    addTag = this.bindIndexMethod('addTag')
    delTag = this.bindIndexMethod('delTag')
    addAnnotationTag = this.bindIndexMethod('addAnnotationTag')
    delAnnotationTag = this.bindIndexMethod('delAnnotationTag')
    getAnnotationTags = this.bindIndexMethod('getAnnotationTags')

    // Bookmarks
    addBookmark = this.bindIndexMethod('addBookmark')
    delBookmark = this.bindIndexMethod('delBookmark')

    // Utilities
    grabExistingKeys = this.bindIndexMethod('grabExistingKeys')
    getPage = this.bindIndexMethod('getPage')

    // Searching & suggesting
    search = this.bindIndexMethod('search')
    suggest = this.bindIndexMethod('suggest')
    getMatchingPageCount = this.bindIndexMethod('getMatchingPageCount')
    domainHasFavIcon = this.bindIndexMethod('domainHasFavIcon')
    extendedSuggest = this.bindIndexMethod('extendedSuggest')
}

const indexInterface = new SearchIndex()
export default indexInterface
