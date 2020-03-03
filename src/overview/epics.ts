import 'rxjs/add/operator/debounceTime'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/filter'

import * as searchBarActs from './search-bar/actions'
import * as resultActs from './results/actions'
import * as filterActs from '../search-filters/actions'

const searchUpdateActions = [
    searchBarActs.setQuery.getType(),
    searchBarActs.setStartDate.getType(),
    searchBarActs.setEndDate.getType(),
    filterActs.toggleBookmarkFilter.getType(),
    filterActs.addTagFilter.getType(),
    filterActs.delTagFilter.getType(),
    filterActs.addExcTagFilter.getType(),
    filterActs.delExcTagFilter.getType(),
    filterActs.toggleTagFilter.getType(),
    filterActs.addIncDomainFilter.getType(),
    filterActs.addExcDomainFilter.getType(),
    filterActs.delIncDomainFilter.getType(),
    filterActs.delExcDomainFilter.getType(),
    filterActs.setIncDomainFilters.getType(),
    filterActs.setExcDomainFilters.getType(),
    filterActs.addIncUserFilter.getType(),
    filterActs.addExcUserFilter.getType(),
    filterActs.delIncUserFilter.getType(),
    filterActs.delExcUserFilter.getType(),
    filterActs.setIncUserFilters.getType(),
    filterActs.setExcUserFilters.getType(),
    filterActs.addIncHashtagFilter.getType(),
    filterActs.addExcHashtagFilter.getType(),
    filterActs.delIncHashtagFilter.getType(),
    filterActs.delExcHashtagFilter.getType(),
    filterActs.setIncHashtagFilters.getType(),
    filterActs.setExcHashtagFilters.getType(),
    filterActs.setTagFilters.getType(),
    filterActs.setExcTagFilters.getType(),
    filterActs.resetFilters.getType(),
    filterActs.toggleListFilter.getType(),
    filterActs.delListFilter.getType(),
    filterActs.toggleHighlightsFilter.getType(),
    filterActs.toggleNotesFilter.getType(),
    filterActs.toggleWebsitesFilter.getType(),
    filterActs.setAnnotationsFilter.getType(),
    filterActs.clearFilterTypes.getType(),
    resultActs.setSearchType.getType(),
]

// When the query changed, refresh the search results
export const refreshSearchResultsUponQueryChange = action$ =>
    action$
        .filter(action => searchUpdateActions.includes(action.type))
        .debounceTime(500) // wait until typing stops for 500ms
        .map(() =>
            searchBarActs.search({ overwrite: true, fromOverview: true }),
        ) // Schedule new fresh (overwriting) search
