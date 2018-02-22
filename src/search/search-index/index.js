import levelup from 'levelup'

import Queue from 'src/util/priority-queue'
import LevelJS from './level-js-to-leveldown'

export const DEFAULT_TERM_SEPARATOR = /[|' .,\-|(\n)]+/
export const URL_SEPARATOR = /[/?#=+& _.,\-|(\n)]+/

// People use the functions exposed directly by
// the default object (like index.search()) to interact with the index.
// For unit testing however, we need to repeatedly set up and
// destroy indices, so we need some way of allowing that.
// This is why we use a single Proxy object that other code can hold a reference
// to while the underlying object may change. See:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
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

// Set up queue to handle scheduling index update requests
const indexQueue = new Queue({
    autostart: true, // Always running, waiting for jobs to come in
    timeout: 10 * 1000, // Don't hold the queue up forever if something goes wrong
    concurrency: 1, // Only one DB-related task should be happening at once
})

indexQueue.on('timeout', next => next())

export function init({ levelDown } = {}) {
    levelDown = levelDown || new LevelJS('worldbrain-terms')
    realIndex = levelup(levelDown)
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
export {
    initSingleLookup,
    keyGen,
    grabExistingKeys,
    removeKeyType,
} from './util'
export { indexQueue }
export default index
