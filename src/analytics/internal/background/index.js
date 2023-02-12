import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import EventLogStorage from './storage'
// import sendToServer from '../send-to-server'

export default class EventLogBackground {
    constructor({ storageManager }) {
        this.storage = new EventLogStorage(storageManager)
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            processEvent: (...params) => {},
        })
    }

    async storeEvent(request) {
        await this.storage.storeEvent(request)
    }

    async getLatestTimeWithCount(request) {
        return this.storage.getLatestTimeWithCount(request)
    }
}
