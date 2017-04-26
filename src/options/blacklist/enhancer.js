import { setBlacklist } from './actions'
import { entireState } from './selectors'
import { STORAGE_KEY } from './constants'

/**
 * Handles hydrating of blacklist data from storage to redux state.
 * @param {any} store Redux store to hydrate.
 */
const hydrateBlacklistFromStorage = store => chrome.storage.local.get(STORAGE_KEY, data => {
    if (!data.blacklist) return

    const blacklist = JSON.parse(data.blacklist)
    store.dispatch(setBlacklist(blacklist))
})

/**
 * Handles syncing of blacklist redux state to storage.
 * @param {any} store Redux store to sync with storage.
 */
const syncBlacklistToStorage = store => store.subscribe(() => {
    const { blacklist } = entireState(store.getState())
    chrome.storage.local.set({ [STORAGE_KEY]: JSON.stringify(blacklist) })
})

export default storeCreator => (reducer, initState, enhancer) => {
    const store = storeCreator(reducer, initState, enhancer)

    // Subscribe to changes and update local storage
    syncBlacklistToStorage(store)

    // Rehydrate blacklist on init from localStorage
    hydrateBlacklistFromStorage(store)

    return store
}
