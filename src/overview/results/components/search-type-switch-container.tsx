import React from 'react'
import { connect, MapStateToProps, MapDispatchToProps } from 'react-redux'

import { RootState } from 'src/options/types'
import * as selectors from '../selectors'
import * as acts from '../actions'
import { SearchTypeSwitch } from './search-type-switch'
import { selectors as filters } from 'src/search-filters'

export interface StateProps {
    annotsFolded: boolean
    searchType: 'page' | 'annot' | 'social'
    isFilterBarActive: boolean
}

export interface DispatchProps {
    handleUnfoldAllClick: React.MouseEventHandler<HTMLButtonElement>
    handleSearchTypeClick: (
        searchType: 'page' | 'annot' | 'social',
    ) => React.MouseEventHandler<HTMLButtonElement>
}

export interface OwnProps {}

export type Props = StateProps & DispatchProps & OwnProps

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = state => ({
    annotsFolded: selectors.areAnnotationsExpanded(state),
    searchType: selectors.searchType(state),
    isFilterBarActive: filters.showFilterBar(state),
})

const mapDispatch: MapDispatchToProps<DispatchProps, OwnProps> = dispatch => ({
    handleSearchTypeClick: searchType => e => {
        e.preventDefault()
        dispatch(acts.setLoading(true))
        dispatch(acts.setSearchType(searchType))
    },
    handleUnfoldAllClick: e => {
        e.preventDefault()
        dispatch(acts.toggleAreAnnotationsExpanded())
    },
})

export default connect(
    mapState,
    mapDispatch,
)(SearchTypeSwitch)
