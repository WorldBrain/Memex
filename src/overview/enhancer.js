import { compose } from 'redux'
import ReduxQuerySync from 'redux-query-sync'

import * as selectors from './selectors'
import * as actions from './actions'
import * as constants from './constants'
import {
    selectors as onboarding,
    actions as onboardingActs,
    constants as onboardingConsts,
} from './onboarding'
import { SHOULD_TRACK_STORAGE_KEY } from 'src/options/privacy/constants'

const parseBool = str => str === 'true'

// Keep search query in sync with the query parameter in the window location.
const locationSync = ReduxQuerySync.enhancer({
    replaceState: true, // We don't want back/forward to stop at every change.
    initialTruth: 'location', // Initialise store from current location.
    params: {
        query: {
            selector: selectors.query,
            action: query => actions.setQueryTagsDomains(query, true),
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
                actions.toggleBookmarkFilter(parseBool(showOnlyBookmarks)),
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
        install: {
            selector: onboarding.isVisible,
            action: value => onboardingActs.setVisible(parseBool(value)),
            defaultValue: false,
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
    hydrate(
        onboardingConsts.STORAGE_KEYS.isImportsDone,
        onboardingActs.setImportsDone,
    )
    hydrate(onboardingConsts.STORAGE_KEYS.progress, onboardingActs.setProgress)
    hydrate(SHOULD_TRACK_STORAGE_KEY, onboardingActs.setShouldTrack)
}

const syncStateToStorage = store =>
    store.subscribe(() => {
        const dump = (key, data) => browser.storage.local.set({ [key]: data })

        const state = store.getState()
        dump(constants.SEARCH_COUNT_KEY, selectors.searchCount(state))
        dump(
            onboardingConsts.STORAGE_KEYS.isImportsDone,
            onboarding.isImportsDone(state),
        )
        dump(onboardingConsts.STORAGE_KEYS.progress, onboarding.progress(state))
        dump(SHOULD_TRACK_STORAGE_KEY, onboarding.shouldTrack(state))
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
