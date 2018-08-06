import { compose } from 'redux'
import ReduxQuerySync from 'redux-query-sync'

import history from '../options/history'
import * as selectors from './selectors'
import * as actions from './actions'
import * as notifActions from '../notifications/actions'
import * as notifSelectors from '../notifications/selectors'
import * as constants from './constants'
import {
    selectors as onboarding,
    actions as onboardingActs,
    constants as onboardingConsts,
} from './onboarding'
import { selectors as filters, actions as filterActs } from '../search-filters'

const parseBool = str => str === 'true'
const parseNumber = str => Number(str)
const stringifyArr = arr => arr.join(',')

// Keep search query in sync with the query parameter in the window location.
const locationSync = ReduxQuerySync.enhancer({
    replaceState: true, // We don't want back/forward to stop at every change.
    initialTruth: 'location', // Initialise store from current location.
    history,
    params: {
        startDate: {
            selector: selectors.startDate,
            action: actions.setStartDate,
            stringToValue: parseNumber,
        },
        endDate: {
            selector: selectors.endDate,
            action: actions.setEndDate,
            stringToValue: parseNumber,
        },
        showOnlyBookmarks: {
            selector: filters.onlyBookmarks,
            action: filterActs.toggleBookmarkFilter,
            stringToValue: parseBool,
            defaultValue: false,
        },
        tags: {
            selector: filters.tags,
            action: filterActs.setTagFilters,
            valueToString: stringifyArr,
            defaultValue: [],
        },
        domainsInc: {
            selector: filters.domainsInc,
            action: filterActs.setIncDomainFilters,
            valueToString: stringifyArr,
            defaultValue: [],
        },
        domainsExc: {
            selector: filters.domainsExc,
            action: filterActs.setExcDomainFilters,
            valueToString: stringifyArr,
            defaultValue: [],
        },
        lists: {
            selector: filters.listFilter,
            action: filterActs.setListFilters,
            defaultValue: '',
        },
        install: {
            selector: onboarding.isVisible,
            action: onboardingActs.setVisible,
            stringToValue: parseBool,
            defaultValue: false,
        },
        query: {
            selector: selectors.query,
            action: actions.setQueryTagsDomains,
            defaultValue: '',
        },
        showInbox: {
            selector: notifSelectors.showInbox,
            action: notifActions.toggleInbox,
            stringToValue: parseBool,
            defaultValue: false,
        },
    },
})

const hydrateStateFromStorage = store => {
    const hydrate = (key, action) =>
        browser.storage.local.get(key).then(data => {
            if (data[key] == null) return

            store.dispatch(action(data[key]))
        })

    // Keep each of these storage keys in sync
    hydrate(constants.SEARCH_COUNT_KEY, actions.initSearchCount)
    hydrate(
        onboardingConsts.STORAGE_KEYS.isImportsDone,
        onboardingActs.setImportsDone,
    )
    hydrate(onboardingConsts.STORAGE_KEYS.progress, onboardingActs.setProgress)
    hydrate(constants.SHOW_TOOL_TIP, actions.setShowTooltip)
    hydrate(constants.TOOL_TIP, actions.setTooltip)
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
        dump(constants.SHOW_TOOL_TIP, selectors.showTooltip(state))
        dump(constants.TOOL_TIP, selectors.tooltip(state))
    })

const storageSync = storeCreator => (reducer, initState, enhancer) => {
    const store = storeCreator(reducer, initState, enhancer)

    // Subscribe to changes and update local storage
    syncStateToStorage(store)

    // Rehydrate state from local storage
    hydrateStateFromStorage(store)

    return store
}

const enhancer = compose(
    locationSync,
    storageSync,
)

export default enhancer
