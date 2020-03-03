import { connect, MapStateToProps } from 'react-redux'
import RootState, { MapDispatchToProps } from 'src/sidebar-overlay/types'
import * as filterActs from 'src/search-filters/actions'
import {
    acts as searchBarActs,
    selectors as searchBar,
} from 'src/overview/search-bar'
import { selectors as results } from 'src/overview/results'
import FiltersSidebar from './filters-sidebar'

interface StateProps {
    showClearFiltersBtn: boolean
    isSocialSearch: boolean
}

interface DispatchProps {
    clearAllFilters: React.MouseEventHandler<HTMLButtonElement>
    fetchSuggestedTags: () => void
    fetchSuggestedDomains: () => void
    fetchSuggestedUsers: () => void
    fetchSuggestedHashtags: () => void
    resetFilterPopups: () => void
}

interface OwnProps {
    env: 'inpage' | 'overview'
    toggleShowFilters: () => void
}

export type Props = StateProps & DispatchProps & OwnProps

const mapStateToProps: MapStateToProps<
    StateProps,
    OwnProps,
    RootState
> = state => ({
    isSocialSearch: results.isSocialPost(state),
    showClearFiltersBtn: searchBar.showClearFiltersBtn(state),
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps
> = dispatch => ({
    clearAllFilters: e => {
        e.preventDefault()
        dispatch(filterActs.resetFilters())
        dispatch(searchBarActs.clearFilters())
    },
    fetchSuggestedTags: () => dispatch(filterActs.fetchSuggestedTags()),
    fetchSuggestedDomains: () => dispatch(filterActs.fetchSuggestedDomains()),
    fetchSuggestedUsers: () => dispatch(filterActs.fetchSuggestedUsers(true)),
    fetchSuggestedHashtags: () => dispatch(filterActs.fetchSuggestedHashtags()),
    resetFilterPopups: () => dispatch(filterActs.resetFilterPopups()),
})

export default connect(mapStateToProps, mapDispatchToProps)(FiltersSidebar)
