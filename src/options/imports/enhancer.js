import * as actions from './actions'
import * as selectors from './selectors'
import { STORAGE_KEYS } from './constants'

const hydrateImportsFromStorage = store => {
    const hydrate = (key, action) => chrome.storage.local.get(key, data => {
        if (!data[key]) return

        const parsedData = JSON.parse(data[key])
        store.dispatch(action(parsedData))
    })

    hydrate(STORAGE_KEYS.DOWNLOAD_DATA, actions.initDownloadData)
    hydrate(STORAGE_KEYS.IMPORT_STATE, actions.initImportState)
}

const syncImportsToStorage = store => store.subscribe(() => {
    const dump = (key, data) => chrome.storage.local.set({ [key]: JSON.stringify(data) })

    const state = store.getState()
    dump(STORAGE_KEYS.DOWNLOAD_DATA, selectors.downloadData(state))
    dump(STORAGE_KEYS.IMPORT_STATE, selectors.importStatus(state))
})

export default storeCreator => (reducer, initState, enhancer) => {
    const store = storeCreator(reducer, initState, enhancer)

    // Subscribe to changes and update local storage
    syncImportsToStorage(store)

    // Rehydrate blacklist on init from localStorage
    hydrateImportsFromStorage(store)

    return store
}
