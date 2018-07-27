import * as oldBackend from './search-index-old/api'
import * as newBackend from './search-index-new'

export class SearchIndex {
    /**
     * Denotes which backend to use; either the old LevelUP-based
     * or the new Dexie-based implementation. Can be set from outside.
     */
    useOld: boolean

    /**
     * In the case where no explicit setting of index backend, it will
     * do some async checks to see if there is old index data existing
     * to decide. This Promise affords checking the status of that from outside.
     */
    dataReady: Promise<void>

    constructor(useOld?: boolean) {
        if (useOld) {
            this.dataReady = Promise.resolve()
            this.useOld = useOld
        } else {
            this.dataReady = oldBackend
                .hasData()
                .catch(() => false)
                .then(hasOldData => {
                    this.useOld = hasOldData
                })
        }
    }

    private get backend(): typeof newBackend {
        return this.useOld ? (oldBackend as any) : newBackend
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

    queue = {
        clear: () => this.backend.indexQueue.clear(),
    }
}

const indexInterface = new SearchIndex()
export default indexInterface
