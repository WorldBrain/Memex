import { createAction } from 'redux-act'
import { remoteFunction } from 'src/util/webextensionRPC'

export const setNotificationList = createAction(
    'notifications/setNotificationList',
)

const getNotifications = remoteFunction('getNotifications')

export const init = () => async (dispatch, getState) => {
    const notifications = await getNotifications()

    dispatch(setNotificationList(notifications))
}
