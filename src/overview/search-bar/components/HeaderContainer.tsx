import { connect } from 'react-redux'

import * as acts from '../actions'
import * as selectors from '../selectors'
import * as notifActs from 'src/notifications/actions'
import * as notifs from 'src/notifications/selectors'
import * as tooltipActs from '../../tooltips/actions'
import * as filterActs from 'src/search-filters/actions'
import * as filters from 'src/search-filters/selectors'
import * as onboardingActs from '../../onboarding/actions'
import Header, { Props } from './Header'
import { remoteFunction } from 'src/util/webextensionRPC'
import { EVENT_NAMES } from 'src/analytics/internal/constants'

const processEventRPC = remoteFunction('processEvent')

const mapState = state => ({
    unreadNotifCount: notifs.unreadNotifCount(state),
    showUnreadCount: notifs.showUnreadCount(state),
    showInbox: notifs.showInbox(state),
    query: selectors.query(state),
    showFilterBar: filters.showFilterBar(state),
    showClearFiltersBtn: selectors.showClearFiltersBtn(state),
})

const mapDispatch: (dispatch: any) => Partial<Props> = dispatch => ({
    toggleInbox: () => dispatch(notifActs.toggleInbox()),
    onQueryChange: e => {
        const el = e.target as HTMLInputElement
        dispatch(acts.setQueryTagsDomains(el.value, false))
    },
    onQueryKeyDown: e => {
        if (e.key === 'Enter') {
            const el = e.target as HTMLInputElement
            dispatch(acts.setQueryTagsDomains(el.value, true))
        }
        // Close search-bar tooltip in overview
        dispatch(tooltipActs.setTooltip('time-filters'))
    },
    toggleFilterBar: () => {
        // Remove and reset onboarding tooltip
        dispatch(tooltipActs.resetTooltips())
        // Tick off Power Search onboarding stage
        dispatch(onboardingActs.setPowerSearchDone())
        processEventRPC({
            type: EVENT_NAMES.FINISH_POWERSEARCH_ONBOARDING,
        })
        dispatch(filterActs.toggleFilterBar())
    },
    clearFilters: e => {
        e.stopPropagation()

        dispatch(filterActs.resetFilters())
        dispatch(acts.clearFilters())
        dispatch(filterActs.setShowFilterBar(false))
    },
})

export default connect(mapState, mapDispatch)(Header)
