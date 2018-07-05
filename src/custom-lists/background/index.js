import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import normalizeUrl from 'src/util/encode-url-for-id'
import CustomListStorage from './storage'

export default class CustomListBackground {
    constructor({ storageManager }) {
        // Makes the custom list Table in indexed DB.
        this.storage = new CustomListStorage({ storageManager })
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
            getAllLists: (...params) => {
                return this.getAllLists(...params)
            },
            fetchListAssocPage: (...params) => {
                return this.fetchListAssocPage(...params)
            },
            getListNameSuggestions: (...params) => {
                return this.getListNameSuggestions(...params)
            },
            checkPageInList: (...params) => {
                return this.checkPageInList(...params)
            },
            fetchListPages: (...params) => {
                return this.fetchListPages(...params)
            },
        })
    }

    async getAllLists({ query = {}, opts = {} }) {
        const lists = await this.storage.fetchAllLists({ query, opts })
        return lists
    }

    /**
     * Takes and ID and returns an array
     * @param {Number} listId
     */
    async fetchListPages({ listId }) {
        return this.storage.fetchListPages(listId)
    }

    /**
     * Takes the url and return all the associated pages with it
     * @param {string} url
     */
    async fetchListAssocPage({ url }) {
        return this.storage.fetchListAssocPage({
            url: normalizeUrl(url),
        })
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

    async insertPageToList({ id, url }) {
        await this.storage.insertPageToList({
            listId: id,
            pageUrl: normalizeUrl(url),
            fullUrl: url,
        })
    }

    async removeList({ id }) {
        await this.storage.removeList({
            id,
        })
    }

    async removePageFromList({ id, url }) {
        await this.storage.removePageFromList({
            listId: id,
            pageUrl: normalizeUrl(url),
        })
    }

    async getListNameSuggestions(name, url) {
        return await this.storage.getListNameSuggestions({
            name,
            url: normalizeUrl(url),
        })
    }

    async checkPageInList({ id, url }) {
        return await this.storage.checkPageInList({
            listId: id,
            pageUrl: normalizeUrl(url),
        })
    }
}
