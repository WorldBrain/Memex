import Storage, { Props } from './storage'
import storageManager from './storex'

let realIndex: Storage = null
const index = new Proxy<Storage>({} as Storage, {
    get: (target, key) => {
        if (!realIndex) {
            init()
        }
        if (key === 'db') {
            return realIndex
        }

        let prop = realIndex[key]
        if (typeof prop === 'function') {
            prop = prop.bind(realIndex)
        }
        return prop
    },
})

export const init = (props?: Props) => {
    realIndex = new Storage({ ...props, storageManager })
    storageManager.finishInitialization()
}

export * from './types'
export * from './models'

export { Storage, storageManager }
export default index

//
// Adding stuff
//

export {
    addPage,
    addPageTerms,
    updateTimestampMeta,
    addVisit,
    addFavIcon,
} from './add'

//
// Deleting stuff

export { delPages, delPagesByDomain, delPagesByPattern } from './del'

//
// Tags-specific
//

export { addTag, delTag, fetchPageTags } from './tags'

//
// Bookmarks-specific
//

export { addBookmark, delBookmark, pageHasBookmark } from './bookmarks'

//
// Utilities
//

export { getPage, grabExistingKeys } from './util'

//
// Searching & suggesting
//

export {
    search,
    suggest,
    extendedSuggest,
    getMatchingPageCount,
    domainHasFavIcon,
} from './search'

export { createPageFromTab, createPageFromUrl } from './on-demand-indexing'
