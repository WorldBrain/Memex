import { createSelector } from 'reselect'

export const notifications = state => state.notifications

export const unreadMessagesCount = createSelector(
    notifications,
    state => state.unreadMessagesCount,
)
