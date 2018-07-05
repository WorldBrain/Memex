import { createAction } from 'redux-act'
import { remoteFunction } from '../util/webextensionRPC'
import { actions as overviewActs } from '../overview'

export const setReadNotificationList = createAction<any>(
    'notifications/setReadNotificationList',
)
export const setUnreadNotificationList = createAction<any>(
    'notifications/setUnreadNotificationList',
)
export const setShowMoreIndex = createAction('notifications/setShowMoreIndex')

const getNotifications = remoteFunction('getNotifications')
const storeNotification = remoteFunction('storeNotification')

export const init = () => async (dispatch, getState) => {
    const unreadnotifications = await getNotifications(false)
    const readnotifications = await getNotifications(true)

    dispatch(setUnreadNotificationList(unreadnotifications))
    dispatch(setReadNotificationList(readnotifications))
}

export const handleReadNotif = notification => async (dispatch, getState) => {
    await storeNotification({
        ...notification,
        readTime: Date.now(),
    })
    dispatch(overviewActs.updateUnreadNotif())
    dispatch(init())
}
