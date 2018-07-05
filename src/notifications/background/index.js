import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import NotificationStorage from './storage'
import * as notifications from '../notifications'

export default class NotificationBackground {
    constructor({ storageManager }) {
        this.storage = new NotificationStorage(storageManager)
    }

    async setup() {
        this.setupRemoteFunctions()
        await this.initNotification()
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            storeNotification: (...params) => {
                return this.storeNotification(...params)
            },
            getUnreadCount: () => {
                return this.getUnreadCount()
            },
            getNotifications: () => {
                return this.getNotifications()
            },
        })
    }

    async storeNotification(request) {
        await this.storage.storeNotification(request)
    }

    async getUnreadCount() {
        return await this.storage.getUnreadCount()
    }

    async getNotifications() {
        return await this.storage.getNotifications()
    }

    async initNotification() {
        for (let notification of notifications.NEW_NOTIFS) {
            notification = {
                ...notification,
                sentTime: Date.now(),
            }

            await this.storeNotification(notification)
        }
    }
}
