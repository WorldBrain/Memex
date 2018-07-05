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
     * @param {Object} obj
     * @param {number} obj.id
     */
    async fetchListPages({ id }) {
        return this.storage.fetchListPages(id)
    }

    /**
     * Takes the url and return all the associated pages with it
     * @param {Object} obj
     * @param {string} obj.url
     */
    async fetchListAssocPage({ url }) {
        return this.storage.fetchListAssocPage({
            url: normalizeUrl(url),
        })
    }

    /**
     * Create a custom list
     *
     * @param {Object} obj
     * @param {string} obj.name
     * @returns {number} id
     * @memberof CustomListBackground
     */
    async createCustomList({ name }) {
        return await this.storage.insertCustomList({
            name,
        })
    }

    /**
     * Update List name
     *
     * @param {Object} obj
     * @param {number} obj.id
     * @param {string} obj.name
     * @memberof CustomListBackground
     */
    async updateList({ id, name }) {
        await this.storage.updateListName({
            id,
            name,
        })
    }

    /**
     *  Adds pages into lists.
     *
     * @param {Object} obj
     * @param {number} obj.id
     * @param {string} obj.url
     * @memberof CustomListBackground
     */
    async insertPageToList({ id, url }) {
        await this.storage.insertPageToList({
            listId: id,
            pageUrl: normalizeUrl(url),
            fullUrl: url,
        })
    }

    /**
     * Deletes list
     *
     * @param {Object} obj
     * @param {number} obj.id
     * @memberof CustomListBackground
     */
    async removeList({ id }) {
        await this.storage.removeList({
            id,
        })
    }

    /**
     * Removes pages from list, doesn't delete them actually
     *
     * @param {Object} obj
     * @param {number} obj.id
     * @param {string} obj.url
     * @memberof CustomListBackground
     */
    async removePageFromList({ id, url }) {
        await this.storage.removePageFromList({
            listId: id,
            pageUrl: normalizeUrl(url),
        })
    }

    /**
     * Returns suggestions based on provided search value.
     * @param {Object} obj
     * @param {string} obj.name
     * @param {string} obj.url
     * @returns
     * @memberof CustomListBackground
     */
    async getListNameSuggestions({ name, url }) {
        return await this.storage.getListNameSuggestions({
            name,
            url: normalizeUrl(url),
        })
    }

    /**
     * check if the page is actually in list
     *
     * @param {Object} obj
     * @param {number} id
     * @param {string} url
     * @returns
     * @memberof CustomListBackground
     */
    async checkPageInList({ id, url }) {
        return await this.storage.checkPageInList({
            listId: id,
            pageUrl: normalizeUrl(url),
        })
    }
}
