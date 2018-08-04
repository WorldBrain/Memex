import { createAction } from 'redux-act'
import { browser } from 'webextension-polyfill-ts'

import { remoteFunction } from '../util/webextensionRPC'
import { actions as overviewActs } from '../overview'
import * as selectors from './selectors'
import * as constants from './constants'
import { NotifDefinition } from './types'
import * as storageKeys from './storage-keys-notif'

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
export const setStorageKeys = createAction<any>('notifications/setStorageKeys')
export const handleReadNotification = createAction<number>(
    'notifications/handleReadNotification',
)

const fetchUnreadNotifications = remoteFunction('fetchUnreadNotifications')
const fetchReadNotifications = remoteFunction('fetchReadNotifications')
const storeNotification = remoteFunction('storeNotification')
const fetchUnreadCount = remoteFunction('fetchUnreadCount')
const readNotification = remoteFunction('readNotification')

export const init = () => async (dispatch, getState) => {
    const storage = await initStorageValue()

    dispatch(setStorageKeys(storage))
    dispatch(handleResults())
}

export const initStorageValue = async () => {
    const keys = {}
    for (const key of Object.keys(storageKeys)) {
        const value = (await browser.storage.local.get(storageKeys[key]))[
            storageKeys[key]
        ]

        // Special case for SHOULD_TRACK_STORAGE_KEY, becuase the default value is not false
        keys[storageKeys[key]] =
            key === 'SHOULD_TRACK_STORAGE_KEY' ? value === true : value
    }

    return keys
}

export const handleResults = () => async (dispatch, getState) => {
    dispatch(setLoading(true))
    const readNotifications = await getReadNotifications({
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
    const readNotifications = await fetchReadNotifications({
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
