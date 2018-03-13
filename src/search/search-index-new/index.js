import Storage from './storage'

// Create main singleton to interact with DB in the ext
let realIndex = null
const index = new Proxy(
    {},
    {
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
    },
)

export function init(idbOpts = {}) {
    realIndex = new Storage(idbOpts)
}

export { Storage }
export default index

//
// Adding stuff
//

export { addPage, addPageTerms, updateTimestampMeta, addVisit } from './add'

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

export { addBookmark, delBookmark, handleBookmarkCreation } from './bookmarks'

//
// Utilities
//

export { getPage, grabExistingKeys } from './util'

//
// Searching & suggesting
//

export { search, suggest, getMatchingPageCount } from './search'

// Mock for old index queue; to remove with old index code
export const indexQueue = { clear() { } }
