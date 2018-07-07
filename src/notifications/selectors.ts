import { State } from './reducer'

const notifications = (state: any): State => state.notifications

export const readNotificationList = state =>
    notifications(state).readNotificationList
export const unreadNotificationList = state =>
    notifications(state).unreadNotificationList
export const showMoreIndex = state => notifications(state).showMoreIndex
