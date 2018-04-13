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

export async function addVisit(...args) {
    return await (await getBackend()).addVisit(...args)
}

//
// Deleting stuff
//
export async function delPages(...args) {
    return await (await getBackend()).delPages(...args)
}

export async function delPagesByDomain(...args) {
    return await (await getBackend()).delPagesByDomain(...args)
}

export async function delPagesByPattern(...args) {
    return await (await getBackend()).delPagesByPattern(...args)
}

//
// Tags
//
export async function addTag(...args) {
    return await (await getBackend()).addTag(...args)
}

export async function delTag(...args) {
    return await (await getBackend()).delTag(...args)
}

//
// Bookmarks
//
export async function addBookmark(...args) {
    return await (await getBackend()).addBookmark(...args)
}

export async function delBookmark(...args) {
    return await (await getBackend()).delBookmark(...args)
}

export async function handleBookmarkCreation(...args) {
    return await (await getBackend()).handleBookmarkCreation(...args)
}

//
// Utilities
//

export async function grabExistingKeys(...args) {
    return await (await getBackend()).grabExistingKeys(...args)
}

export async function getPage(url) {
    return await (await getBackend()).getPage(url)
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

export async function getMatchingPageCount(...args) {
    return await (await getBackend()).getMatchingPageCount(...args)
}

export async function domainHasFavIcon(...args) {
    return await (await getBackend()).domainHasFavIcon(...args)
}

export const indexQueue = {
    clear: async () => {
        ;(await getBackend()).indexQueue.clear()
    },
}
