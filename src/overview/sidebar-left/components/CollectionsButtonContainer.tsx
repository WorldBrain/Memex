import React, { PureComponent } from 'react'
import { connect } from 'react-redux'

import { remoteFunction } from 'src/util/webextensionRPC'
import { EVENT_NAMES } from 'src/analytics/internal/constants'
import CollectionsButton from './collections-button'
import BackToSearch from 'src/overview/sidebar-left/components/BackToSearch'
import { actions as acts } from 'src/overview/sidebar-left/'
import {
    selectors as filters,
    actions as filterActs,
} from '../../../search-filters'
import { selectors as notifs } from 'src/notifications'
import { acts as tooltipActs } from '../../tooltips'
import { actions as onboardingActs } from '../../onboarding'
import { selectors as lists } from 'src/custom-lists'
import * as selectors from '../selectors'

export interface Props {
    showInbox: boolean
}

const processEventRPC = remoteFunction('processEvent')

class CollecstionsButtonContainer extends PureComponent<Props> {
    render() {
        const { showInbox, ...props } = this.props
        if (showInbox) {
            return <BackToSearch />
        }

        return <CollectionsButton {...props} />
    }
}

const mapState = state => ({
    filterActive: filters.showClearFiltersBtn(state),
    activeCollectionName: lists.activeCollectionName(state),
    isListFilterActive: filters.listFilterActive(state),
    isSidebarLocked: selectors.sidebarLocked(state),
    showInbox: notifs.showInbox(state),
})

const mapDispatch = dispatch => ({
    filterBtnClick: () => {
        // Remove and reset onboarding tooltip
        dispatch(tooltipActs.resetTooltips())
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
    onShowBtnClick: () => {
        dispatch(filterActs.delListFilter())
    },
})

export default connect(
    mapState,
    mapDispatch,
)(CollecstionsButtonContainer)
