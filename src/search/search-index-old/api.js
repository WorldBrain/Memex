import index from './index'

export function hasData() {
    return new Promise((resolve, reject) => {
        let empty = true
        index.db
            .createReadStream({
                keys: true,
                values: false,
                limit: 1,
            })
            .on('data', function(data) {
                empty = false
            })
            .on('end', function() {
                resolve(!empty)
            })
    })
}

export {
    addPageConcurrent as addPage,
    addPageTermsConcurrent as addPageTerms,
    updateTimestampMetaConcurrent as updateTimestampMeta,
} from './add'
export { delPagesConcurrent as delPages } from './del'
export { setTags, addTags, delTags, fetchTags } from './tags'
export {
    addBookmarkConcurrent as addBookmark,
    createBookmarkByUrl,
    createNewPageForBookmark,
    removeBookmarkByUrl,
} from './bookmarks'
export { default as suggest } from './suggest'
export { searchConcurrent as search } from './search'
export { initSingleLookup, grabExistingKeys } from './util'
export { indexQueue } from './'
