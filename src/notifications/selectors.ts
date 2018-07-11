import { State } from './reducer'
import { createSelector } from 'reselect'
import { NOTIFICATIONS_PAGE_SIZE } from './constants'

const notifications = (state: any): State => state.notifications

export const readNotificationList = state =>
    notifications(state).readNotificationList
export const unreadNotificationList = state =>
    notifications(state).unreadNotificationList
export const showMoreIndex = state => notifications(state).showMoreIndex
export const currentPage = state => notifications(state).currentPage

export const notificationsSkip = createSelector(
    currentPage,
    page => page * NOTIFICATIONS_PAGE_SIZE,
)
export const isLoading = state => notifications(state).isLoading
export const resultsExhausted = createSelector(
    readNotificationList,
    results => results.resultExhausted
)
export const needsWaypoint = createSelector(
    resultsExhausted,
    isLoading,
    (isExhausted, loading) => !loading && !isExhausted,
)
export const isReadExpanded = state => notifications(state).isReadExpanded
export const isReadShow = createSelector(
    readNotificationList,
    isReadExpanded,
    (notifs, readExpand) => readExpand && notifs.notifications.length !== 0
)