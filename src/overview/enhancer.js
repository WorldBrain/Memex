import { compose } from 'redux'
import ReduxQuerySync from 'redux-query-sync'

import { currentQueryParams, showOnlyBookmarks } from './selectors'
import {
    setQuery,
    setStartDate,
    setEndDate,
    showOnlyBookmarksEnhancer,
} from './actions'

// Keep search query in sync with the query parameter in the window location.
const locationSync = ReduxQuerySync.enhancer({
    replaceState: true, // We don't want back/forward to stop at every change.
    initialTruth: 'location', // Initialise store from current location.
    params: {
        query: {
            selector: state => currentQueryParams(state).query,
            action: query => setQuery(query),
            defaultValue: '',
        },
        startDate: {
            selector: state => currentQueryParams(state).startDate,
            action: startDate => setStartDate(Number(startDate)),
            defaultValue: undefined,
        },
        endDate: {
            selector: state => currentQueryParams(state).endDate,
            action: endDate => setEndDate(Number(endDate)),
            defaultValue: undefined,
        },
        showOnlyBookmarks: {
            selector: state => showOnlyBookmarks(state),
            action: state => showOnlyBookmarksEnhancer(),
            defaultValue: false,
        },
    },
})

const enhancer = compose(locationSync)

export default enhancer
