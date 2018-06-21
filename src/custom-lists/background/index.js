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
            getListAssocPage: (...params) => {
                return this.getListAssocPage(...params)
            },
            getListNameSuggestions: (...params) => {
                return this.getListNameSuggestions(...params)
            },
        })
    }

    // TODO: ALSO GET ALL THE PAGES RELATED TO LIST.
    async getAllLists() {
        const lists = await this.storage.fetchAllList()
        return lists
    }

    async createCustomList({ name }) {
        return await this.storage.insertCustomList({
            name,
        })
    }

    async updateList({ id, name }) {
        await this.storage.updateListName({
            id,
            name,
        })
    }

    // TODO: Just a hack, find a better way.
    async insertPageToList({ id, url }) {
        await this.storage.insertPageToList({
            listId: id,
            pageUrl: url[0],
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

    async getListNameSuggestions(name) {
        return await this.storage.getListNameSuggestions({ name })
    }
}
