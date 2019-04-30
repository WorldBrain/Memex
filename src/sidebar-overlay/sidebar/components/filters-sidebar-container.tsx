import React, { Component } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import RootState, { MapDispatchToProps } from 'src/sidebar-overlay/types'
import { actions as filterActs } from 'src/search-filters'
import {
    acts as searchBarActs,
    selectors as searchBar,
} from 'src/overview/search-bar'
import FiltersSidebar from './filters-sidebar'

interface StateProps {
    showClearFiltersBtn: boolean
}

interface DispatchProps {
    clearAllFilters: React.MouseEventHandler<HTMLButtonElement>
    fetchSuggestedTags: () => void
    fetchSuggestedDomains: () => void
    fetchSuggestedUsers: () => void
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
    resetFilterPopups: () => dispatch(filterActs.resetFilterPopups()),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(FiltersSidebar)
