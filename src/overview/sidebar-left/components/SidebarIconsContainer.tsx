import React, { PureComponent } from 'react'
import { connect } from 'react-redux'

import { remoteFunction } from 'src/util/webextensionRPC'
import { EVENT_NAMES } from 'src/analytics/internal/constants'
import SidebarIcons from './SidebarIcons'
import BackToSearch from './BackToSearch'
import * as acts from '../actions'
import {
    selectors as filters,
    actions as filterActs,
} from '../../../search-filters'
import { selectors as notifs } from '../../../notifications'
import { acts as tooltipActs } from '../../tooltips'
import { actions as onboardingActs } from '../../onboarding'

export interface Props {
    showInbox: boolean
}

const processEventRPC = remoteFunction('processEvent')

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
    filterBtnClick: () => {
        // Remove and reset onboarding tooltip
        dispatch(tooltipActs.setShowTooltip(false))
        dispatch(tooltipActs.setWhichTooltip('none'))
        // Tick off Power Search onboarding stage
        dispatch(onboardingActs.setPowerSearchDone())
        processEventRPC({
            type: EVENT_NAMES.FINISH_POWERSEARCH_ONBOARDING,
        })

        dispatch(acts.openSidebarFilterMode())
    },
    listBtnClick: () => dispatch(acts.openSidebarListMode()),
    onPageDrag: () => dispatch(acts.openSidebarListMode()),
    onClearBtnClick: () => dispatch(filterActs.resetFilters()),
    onShowBtnClick: () => dispatch(filterActs.delListFilter()),
})

export default connect(
    mapState,
    mapDispatch,
)(SidebarIconsContainer)
