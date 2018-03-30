import * as oldBackend from './search-index-old/api'
import * as newBackend from './search-index-new'

export const getBackend = (() => {
    let backend = null
    const get = async function() {
        if (!backend) {
            get._reset({ useOld: await oldBackend.hasData() })
        }
        return backend
    }
    get._reset = ({ useOld }) => {
        backend = useOld ? oldBackend : newBackend
    }
    return get
})()

//
// Adding stuff
//

export async function addPage(...args) {
    return await (await getBackend()).addPage(...args)
}

export async function addPageTerms(...args) {
    return await (await getBackend()).addPageTerms(...args)
}

export async function updateTimestampMeta(...args) {
    return await (await getBackend()).updateTimestampMeta(...args)
}

//
// Deleting stuff
//
export async function delPages(...args) {
    return await (await getBackend()).delPages(...args)
}

//
// Tags
//
export async function setTags(...args) {
    return await (await getBackend()).setTags(...args)
}

export async function addTags(...args) {
    return await (await getBackend()).addTags(...args)
}

export async function delTags(...args) {
    return await (await getBackend()).delTags(...args)
}

export async function fetchTags(...args) {
    return await (await getBackend()).fetchTags(...args)
}

//
// Bookmarks
//
export async function addBookmark(...args) {
    return await (await getBackend()).addBookmark(...args)
}

export async function createBookmarkByUrl(...args) {
    return await (await getBackend()).createBookmarkByUrl(...args)
}

export async function createNewPageForBookmark(...args) {
    return await (await getBackend()).createNewPageForBookmark(...args)
}

export async function removeBookmarkByUrl(...args) {
    return await (await getBackend()).removeBookmarkByUrl(...args)
}

//
// Utilities
//
export function initSingleLookup() {
    let singleLookup
    return async function(...args) {
        if (!singleLookup) {
            singleLookup = (await getBackend()).initSingleLookup()
        }
        return await singleLookup(...args)
    }
}

export async function grabExistingKeys(...args) {
    return await (await getBackend()).grabExistingKeys(...args)
}

//
// Searching & suggesting
//

export async function search(...args) {
    return await (await getBackend()).search(...args)
}

export async function suggest(...args) {
    return await (await getBackend()).suggest(...args)
}

export const indexQueue = {
    clear: async () => {
        ;(await getBackend()).indexQueue.clear()
    },
}

// Export index interface
export { keyGen, removeKeyType } from './util'
