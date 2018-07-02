import Page, { FeatureStorage } from '../../search/search-index-new'
import { ListObject, PageObject } from './types'

const COLLECTION_NAME = 'customLists'
const PAGE_LIST_ENTRY = 'pageListEntries'

// TODO: Add typings for the class
export default class CustomListStorage extends FeatureStorage {
    constructor(storageManager) {
        super(storageManager)

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
                fullUrl: { type: 'string' },
                createdAt: { type: 'datetime' },
            },
            indices: [
                { field: ['listId', 'pageUrl'], pk: true },
                { field: 'listId' },
                { field: 'pageUrl' },
            ],
        })
    }

    // Return all the list in the DB
    //  TODO: Use pagination if required and decide correct types
    async fetchAllList({ query = {}, opts = {} }: { query?: any; opts?: any }) {
        const x = await this.storageManager.findAll(COLLECTION_NAME, query, opts)
        return this.changeListsbeforeSending(x, [])
    }

    async changeListsbeforeSending(lists: object[], pageEnteries) {
        const mappedLists = lists.map((list: ListObject) => {
            const page = pageEnteries.find(({ listId }: PageObject) => listId === list.id)
            delete list["_name_terms"]
            return {
                ...list,
                // Set an empty pages array for manupulating in redux store.
                pages: [],
                active: Boolean(page),
            }
        })
        return mappedLists
    }

    async fetchListById(id: Number) {
        const list = await this.storageManager.findObject(COLLECTION_NAME, { id })
        const pages = await this.storageManager.findAll(PAGE_LIST_ENTRY, { listId: list.id })
        delete list["_name_terms"]
        return {
            ...list,
            pages: pages.map((page: PageObject) => page.fullUrl),
        }
    }

    // Return all the pages associated with a list.
    async fetchListPages(listId) {
        const pages = await this.storageManager.findAll(PAGE_LIST_ENTRY, { listId })

        return pages
    }

    // Returns all the lists containing a certain page.
    async getListAssocPage({ url }) {
        const pages = await this.storageManager.findAll(PAGE_LIST_ENTRY, {
            pageUrl: url,
        })
        const listIds = pages.map(({ listId }: PageObject) => listId)
        const lists = await this.fetchAllList({
            query: {
                id: { $in: listIds }
            }
        })
        return this.changeListsbeforeSending(lists, pages)
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

    async updateListName({ id, name }) {
        await this.storageManager.updateObject(COLLECTION_NAME, {
            id
        },
            {
                $set: {
                    name,
                    createdAt: new Date(),
                }
            })
    }

    // Delete List from the DB.
    async removeList({ id }: { id: number }) {
        await this.storageManager.deleteObject(COLLECTION_NAME, {
            id,
        })
    }

    // TODO: check if the list ID exists in the DB, if not cannot add.
    async insertPageToList({ listId, pageUrl, fullUrl }:
        { listId: number, pageUrl: string, fullUrl: string }) {
        await this.storageManager.putObject(PAGE_LIST_ENTRY, {
            listId,
            pageUrl,
            fullUrl,
            createdAt: new Date(),
        })
    }

    async removePageFromList({ listId, pageUrl }: {
        listId: number, pageUrl: number
    }) {
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

    // Suggestions based on search in popup
    async getListNameSuggestions({ name, url }) {
        const lists = await this.storageManager.suggest(COLLECTION_NAME, {
            name
        })
        const listIds = lists.map(({ id }: ListObject) => id)

        const pageEnteries = await this.storageManager.findAll(PAGE_LIST_ENTRY, {
            listId: { $in: [...listIds] }, pageUrl: url,
        })

        return this.changeListsbeforeSending(lists, pageEnteries)
    }
}