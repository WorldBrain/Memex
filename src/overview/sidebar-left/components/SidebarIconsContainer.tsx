import React, { PureComponent } from 'react'
import { connect } from 'react-redux'

import SidebarIcons from './SidebarIcons'
import BackToSearch from './BackToSearch'
import * as acts from '../actions'
import {
    selectors as filters,
    actions as filterActs,
} from '../../../search-filters'
import { selectors as notifs } from '../../../notifications'

export interface Props {
    showInbox: boolean
}

class SidebarIconsContainer extends PureComponent<Props> {
    render() {
        const { showInbox, ...props } = this.props
        if (showInbox) {
            return <BackToSearch />
        }

        return <SidebarIcons overviewMode {...props} />
    }
}

const mapState = state => ({
    filterActive: filters.showClearFiltersBtn(state),
    isListFilterActive: filters.listFilterActive(state),
    showInbox: notifs.showInbox(state),
})

const mapDispatch = dispatch => ({
    filterBtnClick: () => dispatch(acts.openSidebarFilterMode()),
    listBtnClick: () => dispatch(acts.openSidebarListMode()),
    onPageDrag: () => dispatch(acts.openSidebarListMode()),
    onClearBtnClick: () => dispatch(filterActs.resetFilters()),
    onShowBtnClick: () => dispatch(filterActs.delListFilter()),
})

export default connect(
    mapState,
    mapDispatch,
)(SidebarIconsContainer)
