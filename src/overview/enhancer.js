import { compose } from 'redux'
import ReduxQuerySync from 'redux-query-sync'

import { ourState } from './selectors'
import { setQuery } from './actions'

// Keep search query in sync with the query parameter in the window location.
const locationSync = ReduxQuerySync.enhancer({
    replaceState: true, // We don't want back/forward to stop at every change.
    initialTruth: 'location', // Initialise store from current location.
    params: {
        q: {
            selector: state => ourState(state).currentQueryParams.query,
            action: query => setQuery(query),
            defaultValue: '',
        },
    },
})

const enhancer = compose(
    locationSync,
)

export default enhancer
