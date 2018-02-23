import Storage from './storage'

const instance = new Storage()
export default instance

//
// Adding stuff
//

export async function addPage(...args) {}

export async function addPageTerms(...args) {}

export async function updateTimestampMeta(...args) {}

//
// Deleting stuff
//
export async function delPages(...args) {}

//
// Tags
//
export async function setTags(...args) {}

export async function addTags(...args) {}

export async function delTags(...args) {}

export async function fetchTags(...args) {}

//
// Bookmarks
//
export async function addBookmark(...args) {}

export async function createBookmarkByUrl(...args) {}

export async function createNewPageForBookmark(...args) {}

export async function removeBookmarkByUrl(...args) {}

//
// Utilities
//
export function initSingleLookup() {
    return async function(...args) {}
}

export async function grabExistingKeys(...args) {}

//
// Searching & suggesting
//

export async function search(
    query = { skip: 0, limit: 10 },
    { count = false } = { count: false },
) {}

export async function suggest(...args) {}

export const indexQueue = {}
