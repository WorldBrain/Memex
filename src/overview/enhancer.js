import { compose } from 'redux'
import ReduxQuerySync from 'redux-query-sync'

import history from '../options/history'
import * as notifActions from '../notifications/actions'
import * as notifSelectors from '../notifications/selectors'
import * as constants from './constants'
import { selectors as filters, actions as filterActs } from '../search-filters'
import { selectors as searchBar, acts as searchBarActs } from './search-bar'
import { selectors as results, acts as resultsActs } from './results'

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
            selector: searchBar.startDate,
            action: searchBarActs.setStartDate,
            stringToValue: parseNumber,
        },
        endDate: {
            selector: searchBar.endDate,
            action: searchBarActs.setEndDate,
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
        query: {
            selector: searchBar.query,
            action: searchBarActs.setQueryTagsDomains,
            defaultValue: '',
        },
        showInbox: {
            selector: notifSelectors.showInbox,
            action: notifActions.toggleInbox,
            stringToValue: parseBool,
            defaultValue: false,
        },
        notes: {
            selector: filters.notesFilter,
            action: filterActs.toggleNotesFilter,
            stringToValue: parseBool,
            defaultValue: false,
        },
        highlights: {
            selector: filters.highlightsFilter,
            action: filterActs.toggleHighlightsFilter,
            stringToValue: parseBool,
            defaultValue: false,
        },
        websites: {
            selector: filters.websitesFilter,
            action: filterActs.toggleWebsitesFilter,
            stringToValue: parseBool,
            defaultValue: true,
        },
    },
})

const hydrateStateFromStorage = store => {
    const hydrate = (key, action) =>
        browser.storage.local.get(key).then(data => {
            if (data[key] == null) {
                return
            }

            store.dispatch(action(data[key]))
        })

    // Keep each of these storage keys in sync
    hydrate(constants.SEARCH_COUNT_KEY, resultsActs.initSearchCount)
    hydrate(
        constants.ANNOTATIONS_EXPANDED_KEY,
        resultsActs.setAreAnnotationsExpanded,
    )
}

const syncStateToStorage = store =>
    store.subscribe(() => {
        const dump = (key, data) => browser.storage.local.set({ [key]: data })

        const state = store.getState()

        dump(constants.SEARCH_COUNT_KEY, results.searchCount(state))
        dump(
            constants.ANNOTATIONS_EXPANDED_KEY,
            results.areAnnotationsExpanded(state),
        )
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
