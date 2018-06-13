import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import CustomListStorage from './storage'

export default class DirectLinkingBackground {
    constructor({ storageManager }) {
        // Makes the custom list Table in indexed DB.
        this.storage = new CustomListStorage(storageManager)
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(
            {
                createCustomList: (...params) => {
                    return this.createCustomList(...params)
                },
                insertPageToList: (...params) => {
                    return this.insertPageToList(...params)
                },
            },
            { insertExtraArg: true },
        )
    }
    // TODO: Implement this function for adding list to DB

    async createCustomList(name) {
        return ''
    }

    async insertPageToList({ id }, pageUrl) {
        return ''
    }
}
