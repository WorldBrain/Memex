import { compose } from 'redux'
import ReduxQuerySync from 'redux-query-sync'
import moment from 'moment'

import { ourState } from './selectors'
import { setQuery, setEndDate } from './actions'


const dateFormat = 'DD-MM-YYYY'

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
        t: {
            selector: state => ourState(state).currentQueryParams.endDate,
            action: timestamp => setEndDate(timestamp),
            defaultValue: undefined,
            valueToString: timestamp => moment(timestamp).format(dateFormat),
            stringToValue: string => moment(string, dateFormat).endOf('day').valueOf() || undefined,
        },
    },
})

const enhancer = compose(
    locationSync,
)

export default enhancer
