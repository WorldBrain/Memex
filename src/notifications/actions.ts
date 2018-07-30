import { createAction } from 'redux-act'
import { browser } from 'webextension-polyfill-ts'

import { remoteFunction } from '../util/webextensionRPC'
import { actions as overviewActs } from '../overview'
import * as selectors from './selectors'
import * as constants from './constants'
import { SHOULD_TRACK_STORAGE_KEY as SHOULD_TRACK } from '../options/privacy/constants'
import { NotifDefinition } from './types'

export const setShowMoreIndex = createAction('notifications/setShowMoreIndex')
export const nextPage = createAction('notifications/nextPage')
export const setLoading = createAction<boolean>('notifications/setLoading')
export const toggleReadExpand = createAction('notifications/toggleReadExpand')
export const setNotificationsResult = createAction<NotifDefinition[]>(
    'notifications/setNotificationsResult',
)
export const appendResult = createAction<NotifDefinition[]>(
    'notifications/appendResult',
)

export const toggleInbox = createAction<any>('notifications/toggleInbox')
export const setUnreadCount = createAction<number>(
    'notifications/setUnreadCount',
)
export const setShouldTrack = createAction<boolean>(
    'notifications/setShouldTrack',
)
export const handleReadNotification = createAction<number>(
    'notifications/handleReadNotification',
)

const fetchUnreadNotifications = remoteFunction('fetchUnreadNotifications')
const fetchReadNotifications = remoteFunction('fetchReadNotifications')
const storeNotification = remoteFunction('storeNotification')
const fetchUnreadCount = remoteFunction('fetchUnreadCount')
const readNotification = remoteFunction('readNotification')

export const init = () => async (dispatch, getState) => {
    const shouldTrack = (await browser.storage.local.get(SHOULD_TRACK))[
        SHOULD_TRACK
    ]

    dispatch(setShouldTrack(shouldTrack === true))
    dispatch(handleResults())
}

export const handleResults = () => async (dispatch, getState) => {
    dispatch(setLoading(true))
    let readNotifications = await getReadNotifications({
        notificationsSkip: selectors.notificationsSkip(getState()),
    })
    const unreadNotifications = await getUnreadNotifications()

    const notifications = {
        ...readNotifications,
        notifications: [
            ...unreadNotifications,
            ...readNotifications['notifications'],
        ],
    }

    dispatch(setNotificationsResult(notifications))
    dispatch(setLoading(false))
}

export const getReadNotifications = async ({ notificationsSkip }) => {
    let readNotifications = await fetchReadNotifications({
        limit: constants.NOTIFICATIONS_PAGE_SIZE,
        skip: notificationsSkip,
    })

    return {
        ...readNotifications,
        notifications: readNotifications['notifications'].map(notification => ({
            ...notification,
            isRead: true,
        })),
    }
}

export const getUnreadNotifications = async () => {
    // dispatch(setLoading(true))
    const unreadNotifications = await fetchUnreadNotifications()
    // dispatch(setUnreadNotificationList(unreadNotifications))
    return unreadNotifications
    // dispatch(setLoading(false))
}

export const handleReadNotif = notification => async (dispatch, getState) => {
    await readNotification(notification.id)
    const notificationsList = selectors.notificationsList(getState())

    const index = await new Promise((resolve, reject) => {
        for (let i = 0; i < notificationsList.length; i++) {
            if (notificationsList[i].id === notification.id) {
                resolve(i)
                break
            }
        }
    })

    dispatch(handleReadNotification(Number(index)))
}

export const handleMoreResult = () => async (dispatch, getState) => {
    dispatch(setLoading(true))
    let readNotifications = await fetchReadNotifications({
        limit: constants.NOTIFICATIONS_PAGE_SIZE,
        skip: selectors.notificationsSkip(getState()),
    })

    readNotifications = {
        ...readNotifications,
        notifications: readNotifications['notifications'].map(notification => ({
            ...notification,
            isRead: true,
        })),
    }

    dispatch(appendResult(readNotifications))
    dispatch(setLoading(false))
}

/**
 * Increments the page state before scheduling another notifications result.
 */
export const getMoreNotifications = () => async (dispatch, getState) => {
    dispatch(nextPage())
    dispatch(handleMoreResult())
}

export const updateUnreadNotif = () => async (dispatch, getState) => {
    const unreadNotifs = await fetchUnreadCount()
    dispatch(setUnreadCount(unreadNotifs))
}
