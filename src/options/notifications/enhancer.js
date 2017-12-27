import * as actions from './actions'
import * as selectors from './selectors'

const hydratePrefsFromStorage = store => {
    return browser.storage.local
        .get('unreadMessagesCount')
        .then(storage =>
            store.dispatch(
                actions.unreadMessagesCount(storage['unreadMessagesCount']),
            ),
        )
}

const syncPrefsToStorage = store =>
    store.subscribe(() => {
        const unreadMessagesCount = selectors.unreadMessagesCount(
            store.getState(),
        )
        browser.storage.local.set({
            [unreadMessagesCount]: unreadMessagesCount,
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
