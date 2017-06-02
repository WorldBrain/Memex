import { compose } from 'redux'

import ReduxQuerySync from 'src/util/redux-query-sync'
import { ourState } from './selectors'
import { setQuery, setStartDate, setEndDate } from './actions'

// Keep search query in sync with the query parameter in the window location.
const locationSync = ReduxQuerySync.enhancer({
    replaceState: true, // We don't want back/forward to stop at every change.
    initialTruth: 'location', // Initialise store from current location.
    params: {
        query: {
            selector: state => ourState(state).query,
            action: query => setQuery(query),
            defaultValue: '',
        },
        startDate: {
            selector: state => ourState(state).startDate,
            action: startDate => setStartDate(Number(startDate)),
            defaultValue: undefined,
        },
        endDate: {
            selector: state => ourState(state).endDate,
            action: endDate => setEndDate(Number(endDate)),
            defaultValue: undefined,
        },
    },
})

const enhancer = compose(
    locationSync,
)

export default enhancer
