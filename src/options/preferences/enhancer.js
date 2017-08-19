import * as actions from './actions'
import * as selectors from './selectors'
import { FREEZE_DRY_BOOKMARKS_KEY, FREEZE_DRY_ARCHIVE_KEY } from './constants'

const hydratePrefsFromStorage = async store => {
    const storage = await browser.storage.local.get([FREEZE_DRY_BOOKMARKS_KEY, FREEZE_DRY_ARCHIVE_KEY])

    store.dispatch(actions.setFreezeDryBookmarks(storage[FREEZE_DRY_BOOKMARKS_KEY] || false))
    store.dispatch(actions.setFreezeDryArchive(storage[FREEZE_DRY_ARCHIVE_KEY] || false))
}

const syncPrefsToStorage = store => store.subscribe(() => {
    const isFreezeDryBmEnabled = selectors.freezeDryBookmarks(store.getState())
    const isFreezeDryArEnabled = selectors.freezeDryArchive(store.getState())

    browser.storage.local.set({
        [FREEZE_DRY_BOOKMARKS_KEY]: isFreezeDryBmEnabled,
        [FREEZE_DRY_ARCHIVE_KEY]: isFreezeDryArEnabled,
    })
})

export default storeCreator => (reducer, initState, enhancer) => {
    const store = storeCreator(reducer, initState, enhancer)

    // Subscribe to changes and update local storage
    syncPrefsToStorage(store)

    // Rehydrate blacklist on init from local storage
    hydratePrefsFromStorage(store)

    return store
}
