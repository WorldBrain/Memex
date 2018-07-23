import Storage, { Props } from './storage'
import { StorageManager } from './storage/manager'

// Create main singleton to interact with DB in the ext
const storageManager = new StorageManager()
window['storageMan'] = storageManager
let realIndex: Storage = null

export const init = (props?: Props) => {
    realIndex = new Storage({ ...props, storageManager })
    storageManager._finishInitialization(realIndex)
}

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

export { addTag, delTag } from './tags'

//
// Bookmarks-specific
//

export { addBookmark, delBookmark } from './bookmarks'

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
    getMatchingPageCount,
    domainHasFavIcon,
    extendedSuggest,
} from './search'

export { createPageFromTab, createPageFromUrl } from './on-demand-indexing'
