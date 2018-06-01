import { StoreCreator, StoreEnhancer, Reducer, Store } from 'redux'
import { browser } from 'webextension-polyfill-ts'

import * as acts from './actions'
import * as selectors from './selectors'
import { defaultState as defs } from './reducer'
import { STORAGE_KEYS as KEYS } from './constants'

function hydrateFromStorage(store: Store<any>) {
    const hydrate = (key, action, defVal = undefined) =>
        browser.storage.local.get({ [key]: defVal }).then(storage => {
            if (storage[key] == null) return

            store.dispatch(action(storage[key]))
        })

    hydrate(KEYS.BOOKMARKS, acts.initBookmarks, defs.bookmarks)
    hydrate(KEYS.LINKS, acts.initLinks, defs.memexLinks)
    hydrate(KEYS.STUBS, acts.initStubs, defs.stubs)
    hydrate(KEYS.VISITS, acts.initVisits, defs.visits)
    hydrate(KEYS.VISIT_DELAY, acts.initVisitDelay, defs.visitDelay)
}

function syncToStorage(store: Store<any>) {
    store.subscribe(() => {
        const dump = (key, data) => browser.storage.local.set({ [key]: data })

        const state = store.getState()
        dump(KEYS.BOOKMARKS, selectors.bookmarks(state))
        dump(KEYS.LINKS, selectors.memexLinks(state))
        dump(KEYS.STUBS, selectors.stubs(state))
        dump(KEYS.VISITS, selectors.visits(state))
        dump(KEYS.VISIT_DELAY, selectors.visitDelay(state))
    })
}

export default (creator: StoreCreator) => (
    reducer: Reducer<any>,
    initState,
    enhancer: StoreEnhancer<any>,
) => {
    const store = creator(reducer, initState, enhancer)

    // Subscribe to changes and update local storage
    syncToStorage(store)

    // Rehydrate blacklist on init from localStorage
    hydrateFromStorage(store)

    return store
}
