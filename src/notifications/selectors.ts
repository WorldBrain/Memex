import { State } from './reducer'
import { createSelector } from 'reselect'
import { NOTIFICATIONS_PAGE_SIZE } from './constants'

const notifications = (state: any): State => state.notifications

export const readNotificationList = createSelector(
    notifications,
    state => state.readNotificationList,
)

export const unreadNotificationList = createSelector(
    notifications,
    state => state.unreadNotificationList,
)
export const showMoreIndex = createSelector(
    notifications,
    state => state.showMoreIndex,
)
export const currentPage = createSelector(
    notifications,
    state => state.currentPage,
)

export const notificationsSkip = createSelector(
    currentPage,
    page => page * NOTIFICATIONS_PAGE_SIZE,
)
export const isLoading = createSelector(notifications, state => state.isLoading)
export const resultsExhausted = createSelector(
    readNotificationList,
    results => results.resultExhausted,
)
export const needsWaypoint = createSelector(
    resultsExhausted,
    isLoading,
    (isExhausted, loading) => !loading && !isExhausted,
)
export const isReadExpanded = createSelector(
    notifications,
    state => state.isReadExpanded,
)
export const isReadShow = createSelector(
    readNotificationList,
    isReadExpanded,
    (notifs, readExpand) => readExpand && notifs.notifications.length !== 0,
)
export const showInbox = createSelector(notifications, state => state.showInbox)
export const initUnreadNotifCount = createSelector(
    notifications,
    state => state.unreadNotifCount,
)
export const unreadNotifCount = createSelector(
    unreadNotificationList,
    initUnreadNotifCount,
    (notifs, countUnread) =>
        notifs && notifs.length ? notifs.length : countUnread,
)
export const shouldTrack = createSelector(
    notifications,
    state => state.shouldTrack,
)
export const showUnreadCount = createSelector(
    unreadNotifCount,
    count => count !== 0,
)
