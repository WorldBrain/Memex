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
import { selectors as filters, actions as filterActs } from './filters'
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
            selector: filters.onlyBookmarks,
            action: onlyBookmarks =>
                filterActs.toggleBookmarkFilter(parseBool(onlyBookmarks)),
            defaultValue: false,
        },
        tags: {
            selector: filters.tagsStringify,
            action: tags => filterActs.setTagFilters(tags),
            defaultValue: '',
        },
        domains: {
            selector: filters.domainsStringify,
            action: domains => filterActs.setDomainFilters(domains),
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
            if (!data[key] == null) return

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
    hydrate(constants.SHOW_TOOL_TIP, actions.setShowTooltip)
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
        dump(constants.SHOW_TOOL_TIP, selectors.showTooltip(state))
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
