import { compose } from 'redux'
import ReduxQuerySync from 'redux-query-sync'

import * as selectors from './selectors'
import * as actions from './actions'
import * as constants from './constants'

// Keep search query in sync with the query parameter in the window location.
const locationSync = ReduxQuerySync.enhancer({
    replaceState: true, // We don't want back/forward to stop at every change.
    initialTruth: 'location', // Initialise store from current location.
    params: {
        query: {
            selector: selectors.query,
            action: actions.setQuery,
            defaultValue: '',
        },
        startDate: {
            selector: selectors.startDate,
            action: startDate => actions.setStartDate(Number(startDate)),
            defaultValue: undefined,
        },
        endDate: {
            selector: selectors.endDate,
            action: endDate => actions.setEndDate(Number(endDate)),
            defaultValue: undefined,
        },
        showOnlyBookmarks: {
            selector: selectors.showOnlyBookmarks,
            action: showOnlyBookmarks =>
                actions.toggleBookmarkFilter(Boolean(showOnlyBookmarks)),
            defaultValue: false,
        },
        tags: {
            selector: selectors.filterTagsStringify,
            action: tags => actions.setTagFilters(tags),
            defaultValue: '',
        },
        domains: {
            selector: selectors.filterDomainsStringify,
            action: domains => actions.setDomainFilters(domains),
            defaultValue: '',
        },
    },
})

const hydrateStateFromStorage = store => {
    const hydrate = (key, action) =>
        browser.storage.local.get(key).then(data => {
            if (!data[key]) return
            store.dispatch(action(data[key]))
        })

    // Keep each of these storage keys in sync
    hydrate(constants.SEARCH_COUNT_KEY, actions.initSearchCount)
}

const syncStateToStorage = store =>
    store.subscribe(() => {
        const dump = (key, data) => browser.storage.local.set({ [key]: data })

        const state = store.getState()
        dump(constants.SEARCH_COUNT_KEY, selectors.searchCount(state))
    })

const storageSync = storeCreator => (reducer, initState, enhancer) => {
    const store = storeCreator(reducer, initState, enhancer)

    // Subscribe to changes and update local storage
    syncStateToStorage(store)

    // Rehydrate state from local storage
    hydrateStateFromStorage(store)

    return store
}

const enhancer = compose(locationSync, storageSync)

export default enhancer
