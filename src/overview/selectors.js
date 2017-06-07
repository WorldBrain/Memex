import { createSelector } from 'reselect'

import safelyGet from 'src/util/safe-nested-access'
import orderedGroupBy from 'src/util/ordered-group-by'

export const ourState = state => state.overview
const searchResult = state => ourState(state).searchResult

/**
 * `latestResult` will contain the latest visit (to display in ResultsList);
 * `rest` contains the later visits as an array in original order of appearance (relevance + time)
 */
const resultsStateShape = ([latestResult, ...rest]) => ({ latestResult, rest })

/**
 * Given the search results, group them by URL and shape them so that the UI can easily pick out the
 * latest visit for display in the main view, and the later visits to display on-demand.
 */
export const results = createSelector(searchResult, ({ rows: results } = {}) =>
    orderedGroupBy(
        safelyGet('doc.url')
    )(results)
    .map(resultsStateShape)) // Final map over the groupBy output to make nicer UI state
