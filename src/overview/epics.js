import 'rxjs'

import * as actions from './actions'

// When the query changed, refresh the search results
export const refreshSearchResultsUponQueryChange = action$ => action$
    .ofType(actions.setQuery.getType())
    .debounceTime(200) // wait until typing stops for 200ms
    .map(() => actions.refreshSearch())

// When the database changed, refresh the search results
export const refreshSearchResultsUponLogChange = action$ => action$
    .ofType(actions.handlePouchChange.getType())
    .map(() => actions.refreshSearch())
