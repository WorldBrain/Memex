import { FeatureStorage } from '../../search/search-index-new'
import { ListObject, PageObject } from './types'

const COLLECTION_NAME: string = 'customLists'
const PAGE_LIST_ENTRY = 'pageListEntries'

export default class CustomListStorage extends FeatureStorage {
    constructor(storageManager) {
        super(storageManager)

        // TODO: Name it lists instead of suctom lists
        this.storageManager.registerCollection(COLLECTION_NAME, {
            // different version for adding a new table.
            version: new Date(2018, 6, 12),
            fields: {
                id: { type: 'string', pk: true },
                name: { type: 'text' },
                isDeletable: { type: 'binary' },
                isNestable: { type: 'binary' },
                createdAt: { type: 'datetime' },
            },
            indices: [
                { field: 'id', pk: true, autoInc: true },
                { field: 'name', unique: true },
                { field: 'isDeletable' },
                { field: 'isNestable' },
                { field: 'createdAt' },
            ],
        })

        this.storageManager.registerCollection(PAGE_LIST_ENTRY, {
            // different version for adding a new table.
            version: new Date(2018, 6, 12),
            fields: {
                listId: { type: 'string' },
                pageUrl: { type: 'string' },
                createdAt: { type: 'datetime' },
            },
            indices: [
                { field: 'listId' },
                { field: 'pageUrl' },
                { field: ['listId', 'pageUrl'], pk: true },
            ],
        })
    }

    // Return all the list in the DB
    //  TODO: Use pagination if required.
    async fetchAllList(query = {}) {
        const x = await this.storageManager.findAll(COLLECTION_NAME, query)
        // TODO: Very inefficient
        const promises = x.map(async (list: ListObject) => {
            const pages = await this.storageManager.findAll(PAGE_LIST_ENTRY, { listId: list.id })
            delete list["_&name_terms"]
            return {
                ...list,
                pages: pages.map((page: PageObject) => page.pageUrl),
            }
            // change this
        })
        return Promise.all(promises)
    }

    // TODO: Returns all the pages associated with the list.
    async fetchListPages() {
        return ''
    }

    // TODO: Returns list By Id
    async getListById({ id }) {
        return ''
    }

    // Function to insert into the DB
    async insertCustomList({ name, isDeletable = 1, isNestable = 1 }) {
        return await this.storageManager.putObject(COLLECTION_NAME, {
            name,
            isDeletable,
            isNestable,
            createdAt: new Date(),
        })
    }

    // TODO: Maybe send the full name list object
    async updateListName({ id, name }) {
        await this.storageManager.putObject(COLLECTION_NAME, {
            id,
            name,
            createdAt: new Date(),
        })
    }

    // Delete List from the DB.
    async removeList({ id }) {
        await this.storageManager.deleteObject(COLLECTION_NAME, {
            id,
        })
    }

    // TODO: check if the list ID exists in the DB, if not cannot add.
    async insertPageToList({ listId, pageUrl }) {
        await this.storageManager.putObject(PAGE_LIST_ENTRY, {
            listId,
            pageUrl,
            createdAt: new Date(),
        })
    }

    async removePageFromList({ listId, pageUrl }) {
        const x = await this.storageManager.deleteObject(PAGE_LIST_ENTRY, {
            $and: [
                { listId: { $eq: listId } },
                { pageUrl: { $eq: pageUrl } },
            ],
        })

        return x
    }

    async checkPageInList({ listId, pageUrl }) {

        const x = await this.storageManager.findObject(PAGE_LIST_ENTRY, {
            $and: [
                { listId: { $eq: listId } },
                { pageUrl: { $eq: pageUrl } },
            ],
        })

        return x
    }

    // TODO: change this method.
    async getListNameSuggestions({ name }) {
        var nameRegex = new RegExp("^" + name, "i");
        const x = await this.fetchAllList({
            name: {
                $regex: {
                    $eq: nameRegex,
                }
            }
        })
        return x
    }
}
