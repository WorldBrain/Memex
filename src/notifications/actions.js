import { createAction } from 'redux-act'
import { remoteFunction } from 'src/util/webextensionRPC'
import UnreadNotifications from 'src/util/unread-notifications'

export const setReadNotificationList = createAction(
    'notifications/setReadNotificationList',
)
export const setUnreadNotificationList = createAction(
    'notifications/setUnreadNotificationList',
)
export const setShowMoreIndex = createAction('notifications/setShowMoreIndex')
export const setUnreadNotis = createAction('notifications/setUnreadNotis')

const getNotifications = remoteFunction('getNotifications')
const storeNotification = remoteFunction('storeNotification')

export const init = () => async (dispatch, getState) => {
    const unreadnotifications = await getNotifications(false)
    const readnotifications = await getNotifications(true)

    dispatch(setUnreadNotificationList(unreadnotifications))
    dispatch(setReadNotificationList(readnotifications))
    updateUnreadNotif()
}

export const handleReadNotif = notification => async (dispatch, getState) => {
    await storeNotification({
        ...notification,
        readTime: Date.now(),
    })
}

export const updateUnreadNotif = () => async (dispatch, getState) => {
    const unreadNotis = await UnreadNotifications()
    dispatch(setUnreadNotis(unreadNotis))
}
