import * as actions from './actions'
import * as selectors from './selectors'
import { STORAGE_KEYS } from './constants'

const hydrateImportsFromStorage = store => {
    const hydrate = (key, action) =>
        browser.storage.local.get(key).then(data => {
            if (!data[key]) {
                return
            }

            const parsedData =
                typeof data[key] === 'string'
                    ? JSON.parse(data[key])
                    : data[key]
            store.dispatch(action(parsedData))
        })

    hydrate(STORAGE_KEYS.ALLOW_TYPES, actions.initAllowTypes)
    hydrate(STORAGE_KEYS.DOWNLOAD_DATA, actions.initDownloadData)
    hydrate(STORAGE_KEYS.TOTALS_STATE, actions.initTotalsCounts)
    hydrate(STORAGE_KEYS.SUCCESS_STATE, actions.initSuccessCounts)
    hydrate(STORAGE_KEYS.FAIL_STATE, actions.initFailCounts)
}

const syncImportsToStorage = store =>
    store.subscribe(() => {
        const dump = (key, data) => browser.storage.local.set({ [key]: data })

        const state = store.getState()
        dump(STORAGE_KEYS.ALLOW_TYPES, selectors.allowTypes(state))
        dump(STORAGE_KEYS.DOWNLOAD_DATA, selectors.downloadData(state))
        dump(STORAGE_KEYS.TOTALS_STATE, selectors.totals(state))
        dump(STORAGE_KEYS.SUCCESS_STATE, selectors.success(state))
        dump(STORAGE_KEYS.FAIL_STATE, selectors.fail(state))
    })

export default storeCreator => (reducer, initState, enhancer) => {
    const store = storeCreator(reducer, initState, enhancer)

    // Subscribe to changes and update local storage
    syncImportsToStorage(store)

    // Rehydrate blacklist on init from localStorage
    hydrateImportsFromStorage(store)

    return store
}
