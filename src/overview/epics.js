import 'rxjs/add/operator/debounceTime'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/filter'

import * as actions from './actions'
import { actions as onboardingActs } from './onboarding'

const searchUpdateActions = [
    actions.setQuery.getType(),
    actions.setStartDate.getType(),
    actions.setEndDate.getType(),
    actions.toggleBookmarkFilter.getType(),
    actions.addTagFilter.getType(),
    actions.delTagFilter.getType(),
    actions.addDomainFilter.getType(),
    actions.delDomainFilter.getType(),
    actions.resetFilters.getType(),
    actions.setTagFilters.getType(),
    actions.setDomainFilters.getType(),
    onboardingActs.setVisible.getType(),
]

// When the query changed, refresh the search results
export const refreshSearchResultsUponQueryChange = action$ =>
    action$
        .filter(action => searchUpdateActions.includes(action.type))
        .debounceTime(500) // wait until typing stops for 500ms
        .map(() => actions.search({ overwrite: true })) // Schedule new fresh (overwriting) search
