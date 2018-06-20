import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import EventLogStorage from './storage'

export default class DirectLinkingBackground {
    constructor({ storageManager }) {
        this.storage = new EventLogStorage(storageManager)
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            storeEvent: (...params) => {
                return this.storeEvent(...params)
            },
            getCount: (...params) => {
                return this.getCount(...params)
            },
            getLatestEvent: (...params) => {
                return this.getLatestEvent(...params)
            },
        })
    }

    async storeEvent(request) {
        await this.storage.storeEvent(request)
    }

    async getCount(request) {
        return await this.storage.getCount(request)
    }

    async getLatestEvent(request) {
        return await this.storage.getLatestEvent(request)
    }
}
