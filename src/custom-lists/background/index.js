import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import CustomListStorage from './storage'

export default class CustomListBackground {
    constructor({ storageManager }) {
        // Makes the custom list Table in indexed DB.
        this.storage = new CustomListStorage(storageManager)
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            createCustomList: (...params) => {
                return this.createCustomList(...params)
            },
            insertPageToList: (...params) => {
                return this.insertPageToList(...params)
            },
            updateListName: (...params) => {
                return this.updateList(...params)
            },
            removeList: (...params) => {
                return this.removeList(...params)
            },
            removePageFromList: (...params) => {
                return this.removePageFromList(...params)
            },
            getListById: (...params) => {
                return this.getListById(...params)
            },
            getAllLists: (...params) => {
                return this.getAllLists(...params)
            },
        })
    }

    async getAllLists() {
        await this.storage.fetchAllList()
    }

    async createCustomList({ name }) {
        await this.storage.insertCustomList({
            name,
        })
    }

    async updateList({ id, name }) {
        await this.storage.updateListName({
            id,
            name,
        })
    }

    async insertPageToList({ id, url }) {
        await this.storage.insertPageToList({
            listId: id,
            pageUrl: url,
        })
    }

    async removeList({ id }) {
        await this.storage.removeList({
            id,
        })
    }

    async removePageFromList({ id, pageUrl }) {
        await this.storage.removePageFromList({
            id,
            pageUrl,
        })
    }

    async getListById({ id }) {
        await this.storage.getListById({
            id,
        })
    }
}
