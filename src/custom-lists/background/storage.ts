import { FeatureStorage } from '../../search/search-index-new/storage'
import { PageList, PageListEntry } from './types'


// TODO: Add typings for the class
export default class CustomListStorage extends FeatureStorage {
    static CUSTOM_LISTS_COLL = 'customLists'
    static LIST_ENTRIES_COLL = 'pageListEntries'

    constructor({ storageManager }) {
        super(storageManager)
        this.storageManager.registerCollection(CustomListStorage.CUSTOM_LISTS_COLL, {
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


        this.storageManager.registerCollection(CustomListStorage.LIST_ENTRIES_COLL, {
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

    // Takes the list as they come from Db and does some pre-processing before sending.
    private async changeListsBeforeSending(lists: object[], pageEnteries: object[]) {
        const mappedLists = lists.map((list: PageList) => {
            const page = pageEnteries.find(({ listId }: PageListEntry) => listId === list.id)
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

    // Return all the list in the DB
    //  TODO: Use pagination if required and decide correct types
    async fetchAllLists({ query = {}, opts = {} }: { query?: any; opts?: any }) {
        const x = await this.storageManager.findAll(CustomListStorage.CUSTOM_LISTS_COLL, query, opts)
        return this.changeListsBeforeSending(x, [])
    }

    async fetchListById(id: number) {
        const list = await this.storageManager.findObject(CustomListStorage.CUSTOM_LISTS_COLL, { id })
        const pages = await this.storageManager.findAll(CustomListStorage.LIST_ENTRIES_COLL, { listId: list.id })
        delete list["_name_terms"]
        return list ? {
            ...list,
            pages: pages.map((page: PageListEntry) => page.fullUrl),
        } : null
    }

    // Return all the pages associated with a list.
    async fetchListPages(listId: number) {
        return await this.storageManager.findAll(CustomListStorage.LIST_ENTRIES_COLL, { listId })
    }

    // Returns all the lists containing a certain page.
    async fetchListAssocPage({ url }: { url: string }) {
        const pages = await this.storageManager.findAll(CustomListStorage.LIST_ENTRIES_COLL, {
            pageUrl: url,
        })
        const listIds = pages.map(({ listId }: PageListEntry) => listId)
        const lists = await this.fetchAllLists({
            query: {
                id: { $in: listIds }
            }
        })
        return this.changeListsBeforeSending(lists, pages)
    }

    // Function to insert into the DB
    async insertCustomList({ name, isDeletable = 1, isNestable = 1 }: {
        name: string, isDeletable: 0 | 1, isNestable: 0 | 1
    }) {
        return await this.storageManager.putObject(CustomListStorage.CUSTOM_LISTS_COLL, {
            name,
            isDeletable,
            isNestable,
            createdAt: new Date(),
        })
    }

    async updateListName({ id, name }: { id: number, name: string }) {
        await this.storageManager.updateObject(CustomListStorage.CUSTOM_LISTS_COLL, {
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
        await this.storageManager.deleteObject(CustomListStorage.CUSTOM_LISTS_COLL, {
            id,
        })
        // Delete All pages associated with that list also
        await this.storageManager.deleteObject(CustomListStorage.LIST_ENTRIES_COLL, {
            listId: id,
        })
    }

    // Adds mapping to lists and pages table.
    async insertPageToList({ listId, pageUrl, fullUrl }:
        { listId: number, pageUrl: string, fullUrl: string }) {

        // check if the list ID exists in the DB, if not cannot add.
        const idExists = Boolean(await this.fetchListById(listId))

        if (idExists) {
            await this.storageManager.putObject(CustomListStorage.LIST_ENTRIES_COLL, {
                listId,
                pageUrl,
                fullUrl,
                createdAt: new Date(),
            })
        }
    }

    // Removes the page from list.
    async removePageFromList({ listId, pageUrl }: {
        listId: number, pageUrl: number
    }) {
        const x = await this.storageManager.deleteObject(CustomListStorage.LIST_ENTRIES_COLL, {
            listId,
            pageUrl
        })

        return x
    }

    async checkPageInList({ listId, pageUrl }: { listId: number, pageUrl: string }) {
        const x = await this.storageManager.findObject(CustomListStorage.LIST_ENTRIES_COLL, {
            $and: [
                { listId: { $eq: listId } },
                { pageUrl: { $eq: pageUrl } },
            ],
        })

        return x
    }

    // Suggestions based on search in popup
    async getListNameSuggestions({ name, url }: { name: string, url: string }) {
        const lists = await this.storageManager.suggest(CustomListStorage.CUSTOM_LISTS_COLL, {
            name
        })
        const listIds = lists.map(({ id }: PageList) => id)

        // Gets all the pages associated with all the lists.
        const pageEnteries = await this.storageManager.findAll(CustomListStorage.LIST_ENTRIES_COLL, {
            listId: { $in: listIds }, pageUrl: url,
        })

        // Final pre-processing before sending in the lists.
        return this.changeListsBeforeSending(lists, pageEnteries)
    }
}