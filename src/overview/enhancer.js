import { compose } from 'redux'
import ReduxQuerySync from 'redux-query-sync'

import { currentQueryParams } from './selectors'
import { setQuery, setStartDate, setEndDate } from './actions'

// Keep search query in sync with the query parameter in the window location.
const locationSync = ReduxQuerySync.enhancer({
    replaceState: true, // We don't want back/forward to stop at every change.
    initialTruth: 'location', // Initialise store from current location.
    params: {
        query: {
            selector: state => currentQueryParams(state).query,
            action: query => setQuery({query}),
            defaultValue: '',
        },
        startDate: {
            selector: state => currentQueryParams(state).startDate,
            action: startDate => setStartDate({startDate: Number(startDate)}),
            defaultValue: undefined,
        },
        endDate: {
            selector: state => currentQueryParams(state).endDate,
            action: endDate => setEndDate({endDate: Number(endDate)}),
            defaultValue: undefined,
        },
    },
})

const enhancer = compose(
    locationSync,
)

export default enhancer
