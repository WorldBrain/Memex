import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import NotificationStorage from './storage'

export default class NotificationBackground {
    constructor({ storageManager }) {
        this.storage = new NotificationStorage(storageManager)
    }

    setupRemoteFunctions() {
        console.log('Here')
        makeRemotelyCallable({
            storeNotification: (...params) => {
                return this.storeNotification(...params)
            },
            getUnreadCount: (...params) => {
                return this.getUnreadCount(...params)
            },
        })
    }

    async storeNotification(request) {
        await this.storage.storeNotification(request)
    }

    async getUnreadCount() {
        return await this.storage.getUnreadCount()
    }
}
