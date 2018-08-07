import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import EventLogStorage from './storage'
import sendToServer from '../send-to-server'
import internalAnalytics from '../'

export default class EventLogBackground {
    constructor({ storageManager }) {
        this.storage = new EventLogStorage(storageManager)
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            storeEvent: (...params) => {
                return this.storeEvent(...params)
            },
            getLatestTimeWithCount: (...params) => {
                return this.getLatestTimeWithCount(...params)
            },
            trackEvent: (...params) => {
                return sendToServer.trackEvent(...params)
            },
            processEvent: (...params) => {
                return internalAnalytics.processEvent(...params)
            },
        })
    }

    async storeEvent(request) {
        await this.storage.storeEvent(request)
    }

    async getLatestTimeWithCount(request) {
        return this.storage.getLatestTimeWithCount(request)
    }
}
