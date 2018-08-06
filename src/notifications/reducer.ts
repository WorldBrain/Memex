import { createReducer } from 'redux-act'
import { Notification } from './types'
import * as actions from './actions'

export interface State {
    notificationsList: Notification[]
    resultExhausted: boolean
    showMoreIndex?: string
    currentPage: number
    isLoading: boolean
    isReadExpanded: boolean
    showInbox: boolean
    unreadNotifCount: number
    localStorageNotif: any
}

const defaultState: State = {
    notificationsList: [],
    resultExhausted: false,
    showMoreIndex: undefined,
    currentPage: 0,
    isLoading: true,
    isReadExpanded: false,
    showInbox: false,
    unreadNotifCount: 0,
    localStorageNotif: {},
}

const nextPage = () => (state: State) => ({
    ...state,
    currentPage: state.currentPage + 1,
})

// Updates notifications result state by either overwriting or appending
const handleNotificationResult = ({ overwrite }) => (
    state,
    newNotificationResult,
) => {
    const readNotificationList = overwrite
        ? newNotificationResult
        : {
              ...newNotificationResult,
              notifications: [
                  ...state.readNotificationList.notifications,
                  ...newNotificationResult.notifications,
              ],
          }

    return { ...state, readNotificationList }
}

const handleReadNotification = () => (state, index) => {
    const notification = state.notificationsList[index]

    return {
        ...state,
        notificationsList: [
            ...state.notificationsList.slice(0, index),
            {
                ...notification,
                isRead: true,
            },
            ...state.notificationsList.slice(index + 1),
        ],
    }
}

const appendNotifications = () => (state, newNotifications) => {
    return {
        ...state,
        notificationsList: [
            ...state.notificationsList,
            ...newNotifications.notifications,
        ],
        resultExhausted: newNotifications.resultExhausted,
    }
}

const setNotifications = () => (state, notifications) => ({
    ...state,
    notificationsList: notifications.notifications,
    resultExhausted: notifications.resultExhausted,
})

const toggleExpand = () => state => ({
    ...state,
    isReadExpanded: !state.isReadExpanded,
})

const toggleShowInbox = () => state => ({
    ...state,
    showInbox: !state.showInbox,
})

const initState = <T>(key) => (state: State, payload: T) => ({
    ...state,
    [key]: payload,
})

const reducer = createReducer<State>({}, defaultState)

reducer.on(actions.setNotificationsResult, setNotifications())
reducer.on(actions.setShowMoreIndex, initState<boolean>('showMoreIndex'))
reducer.on(actions.nextPage, nextPage())
reducer.on(actions.setLoading, initState<boolean>('isLoading'))

reducer.on(actions.toggleReadExpand, toggleExpand())
reducer.on(actions.toggleInbox, toggleShowInbox())
reducer.on(actions.setUnreadCount, initState<number>('unreadNotifCount'))
reducer.on(actions.setStorageKeys, initState<any>('localStorageNotif'))
reducer.on(actions.handleReadNotification, handleReadNotification())
reducer.on(actions.appendResult, appendNotifications())

export default reducer
