import 'rxjs/add/operator/debounceTime'
import 'rxjs/add/operator/map'


import * as actions from './actions'

// When the query changed, refresh the search results
export const refreshSearchResultsUponQueryChange = action$ => action$
    .ofType(actions.setQuery.getType())
    .debounceTime(500) // wait until typing stops for 500ms
    .map(() => actions.refreshSearch({loadingIndicator:true}))

// When the database changed, refresh the search results
export const refreshSearchResultsUponLogChange = action$ => action$
    .ofType(actions.handlePouchChange.getType())
    .debounceTime(1000)
    .map(() => actions.refreshSearch({loadingIndicator:false}))
