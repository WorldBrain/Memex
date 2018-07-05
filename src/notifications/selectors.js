const notifications = state => state.notifications

export const readNotificationList = state =>
    notifications(state).readNotificationList
export const unreadNotificationList = state =>
    notifications(state).unreadNotificationList
export const showMoreIndex = state => notifications(state).showMoreIndex
export const unreadNotifications = state =>
    notifications(state).unreadNotifications
