import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import normalizeUrl from 'src/util/encode-url-for-id'
import CustomListStorage from './storage'
import internalAnalytics from '../../analytics/internal'

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
            fetchAllLists: (...params) => {
                return this.fetchAllLists(...params)
            },
            fetchListById: (...params) => {
                return this.fetchListById(...params)
            },
            fetchListPagesByUrl: (...params) => {
                return this.fetchListPagesByUrl(...params)
            },
            fetchListNameSuggestions: (...params) => {
                return this.fetchListNameSuggestions(...params)
            },
            fetchListPagesById: (...params) => {
                return this.fetchListPagesById(...params)
            },
            fetchListIgnoreCase: (...params) => {
                return this.fetchListIgnoreCase(...params)
            },
        })
    }

    async fetchAllLists({ excludeIds = [], skip = 0, limit = 20 }) {
        const query = {
            id: { $nin: excludeIds },
        }

        const opts = {
            limit,
            skip,
        }

        return this.storage.fetchAllLists({ query, opts })
    }

    /**
     * Takes an id and returns the list object associated with it.
     * @param {Object} obj
     * @param {number} id
     * @returns {Object}
     */
    async fetchListById({ id }) {
        return this.storage.fetchListById(id)
    }

    /**
     * Takes and ID and returns an array
     * @param {Object} obj
     * @param {number} obj.id
     */
    async fetchListPagesById({ id }) {
        return this.storage.fetchListPagesById({
            listId: id,
        })
    }

    /**
     * Takes the url and return all the associated pages with it
     * @param {Object} obj
     * @param {string} obj.url
     */
    async fetchListPagesByUrl({ url }) {
        return this.storage.fetchListPagesByUrl({
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
        internalAnalytics.processEvent({
            type: 'createCollection',
        })

        return this.storage.insertCustomList({
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
        return this.storage.updateListName({
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
        internalAnalytics.processEvent({
            type: 'insertPageToCollection',
        })

        return this.storage.insertPageToList({
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
        internalAnalytics.processEvent({
            type: 'removeCollection',
        })

        return this.storage.removeList({
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
        internalAnalytics.processEvent({
            type: 'removePageFromCollection',
        })

        return this.storage.removePageFromList({
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
    async fetchListNameSuggestions({ name, url }) {
        return this.storage.fetchListNameSuggestions({
            name,
            url: normalizeUrl(url),
        })
    }

    /**
     * Fetch lists while ignoring the case used in the name
     *
     * @param {Object}  obj
     * @param {string}  obj.name
     * @returns
     * @memberof CustomListBackground
     */
    async fetchListIgnoreCase({ name }) {
        return this.storage.fetchListIgnoreCase({ name })
    }
}
