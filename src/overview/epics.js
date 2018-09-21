import 'rxjs/add/operator/debounceTime'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/filter'

import { acts as searchBarActs } from './search-bar'
import { actions as filterActs } from '../search-filters'

const searchUpdateActions = [
    searchBarActs.setQuery.getType(),
    searchBarActs.setStartDate.getType(),
    searchBarActs.setEndDate.getType(),
    filterActs.toggleBookmarkFilter.getType(),
    filterActs.addTagFilter.getType(),
    filterActs.delTagFilter.getType(),
    filterActs.toggleTagFilter.getType(),
    filterActs.addIncDomainFilter.getType(),
    filterActs.addExcDomainFilter.getType(),
    filterActs.delIncDomainFilter.getType(),
    filterActs.delExcDomainFilter.getType(),
    filterActs.setIncDomainFilters.getType(),
    filterActs.setExcDomainFilters.getType(),
    filterActs.setTagFilters.getType(),
    filterActs.resetFilters.getType(),
    filterActs.toggleListFilter.getType(),
    filterActs.delListFilter.getType(),
]

// When the query changed, refresh the search results
export const refreshSearchResultsUponQueryChange = action$ =>
    action$
        .filter(action => searchUpdateActions.includes(action.type))
        .debounceTime(500) // wait until typing stops for 500ms
        .map(() => searchBarActs.search({ overwrite: true })) // Schedule new fresh (overwriting) search
