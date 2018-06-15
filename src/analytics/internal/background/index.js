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
        })
    }

    async storeEvent(request) {
        await this.storage.storeEvent(request)
    }
}
