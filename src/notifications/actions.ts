import { createAction } from 'redux-act'
import { remoteFunction } from '../util/webextensionRPC'
import { actions as overviewActs } from '../overview'
import * as selectors from './selectors'
import * as constants from './constants'

export const setReadNotificationList = createAction<any>(
    'notifications/setReadNotificationList',
)

export const setUnreadNotificationList = createAction<any>(
    'notifications/setUnreadNotificationList',
)
export const setShowMoreIndex = createAction('notifications/setShowMoreIndex')
export const nextPage = createAction('notifications/nextPage')
export const setLoading = createAction<boolean>('notifications/setLoading')
export const toggleReadExpand = createAction('notifications/toggleReadExpand')
export const appendReadNotificationResult = createAction<any>('notifications/setSearchResult')
export const setReadNotificationResult = createAction<any>('notifications/setReadNotificationResult')
export const toggleInbox = createAction<any>('notifications/toggleInbox')
export const setUnreadCount = createAction<number>('notific ations/setUnreadCount')

const fetchUnreadNotifications = remoteFunction('fetchUnreadNotifications')
const fetchReadNotifications = remoteFunction('fetchReadNotifications')
const storeNotification = remoteFunction('storeNotification')

export const init = () => async (dispatch, getState) => {
    dispatch(getUnreadNotifications())
    dispatch(getReadNotifications())
}

export const getReadNotifications = ({ overwrite } = { overwrite: false }) => async (dispatch, getState) => {
    dispatch(setLoading(true))


    const readNotifications = await fetchReadNotifications({
        limit: constants.NOTIFICATIONS_PAGE_SIZE,
        skip: selectors.notificationsSkip(getState()),
    })

    const notifAction = overwrite? setReadNotificationResult: appendReadNotificationResult

    dispatch(notifAction(readNotifications))
    dispatch(setLoading(false))
}

export const getUnreadNotifications = () => async (dispatch, getState) => {
    dispatch(setLoading(true))
    const unreadNotifications = await fetchUnreadNotifications()
    dispatch(setUnreadNotificationList(unreadNotifications))

    dispatch(setLoading(false))
}

export const handleReadNotif = notification => async (dispatch, getState) => {
    await storeNotification({
        ...notification,
        readTime: Date.now(),
    })
    dispatch(overviewActs.updateUnreadNotif())
    
    dispatch(getUnreadNotifications())
    dispatch(getReadNotifications({ overwrite: true }))
}

/**
 * Increments the page state before scheduling another notifications result.
 */
export const getMoreNotifications = () => dispatch => {
    dispatch(nextPage())
    dispatch(getReadNotifications())
}
