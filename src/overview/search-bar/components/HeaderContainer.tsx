import { connect } from 'react-redux'

import * as acts from '../actions'
import * as selectors from '../selectors'
import {
    actions as notifActs,
    selectors as notifs,
} from '../../../notifications'
import { selectors as onboarding } from '../../onboarding'
import { acts as tooltipActs } from '../../tooltips'

import Header, { Props } from './Header'

const mapState = state => ({
    isSearchDisabled: onboarding.isVisible(state),
    unreadNotifCount: notifs.unreadNotifCount(state),
    showUnreadCount: notifs.showUnreadCount(state),
    showInbox: notifs.showInbox(state),
    startDate: selectors.startDate(state),
    endDate: selectors.endDate(state),
    query: selectors.query(state),
})

const mapDispatch: (dispatch: any) => Partial<Props> = dispatch => ({
    toggleInbox: () => dispatch(notifActs.toggleInbox()),
    onStartDateChange: date => dispatch(acts.setStartDate(date)),
    onEndDateChange: date => dispatch(acts.setEndDate(date)),
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
        dispatch(tooltipActs.setWhichTooltip('time-filters'))
    },
    changeTooltip: () => {
        // Change tooltip notification to more filters once the user selects date
        dispatch(tooltipActs.setWhichTooltip('more-filters'))
    },
})

export default connect(
    mapState,
    mapDispatch,
)(Header)
