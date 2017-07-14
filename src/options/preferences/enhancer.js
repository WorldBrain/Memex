import * as actions from './actions'
import * as selectors from './selectors'
import { FREEZE_DRY_BOOKMARKS_KEY } from './constants'

const hydratePrefsFromStorage = store =>
    browser.storage.local.get(FREEZE_DRY_BOOKMARKS_KEY).then(storage =>
        store.dispatch(actions.setFreezeDryBookmarks(storage[FREEZE_DRY_BOOKMARKS_KEY] || false)))

const syncPrefsToStorage = store => store.subscribe(() => {
    const isFreezeDryBmEnabled = selectors.freezeDryBookmarks(store.getState())
    browser.storage.local.set({ [FREEZE_DRY_BOOKMARKS_KEY]: isFreezeDryBmEnabled })
})

export default storeCreator => (reducer, initState, enhancer) => {
    const store = storeCreator(reducer, initState, enhancer)

    // Subscribe to changes and update local storage
    syncPrefsToStorage(store)

    // Rehydrate blacklist on init from local storage
    hydratePrefsFromStorage(store)

    return store
}
