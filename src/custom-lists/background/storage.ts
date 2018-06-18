import { FeatureStorage } from '../../search/search-index-new'

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
                '++id': { type: 'string', pk: true },
                name: { type: 'text' },
                isDeletable: { type: 'binary' },
                isNestable: { type: 'binary' },
                createdAt: { type: 'datetime' },
            },
            indices: ['++id', 'name', 'isDeletable', 'createdAt'],
        })

        this.storageManager.registerCollection(PAGE_LIST_ENTRY, {
            // different version for adding a new table.
            version: new Date(2018, 6, 12),
            fields: {
                listId: { type: 'string' },
                pageUrl: { type: 'string' },
                createdAt: { type: 'datetime' },
            },
            indices: ['listId', 'pageUrl'],
        })
    }

    // Return all the list in the DB
    //  TODO: Use pagination if required.
    async fetchAllList() {
        return ''
    }

    // TODO: Returns all the pages associated with the list.
    async fetchListPages() {
        return ''
    }

    // TODO: for naming lists uniquely and issuing warning about duplicate names
    async checkListNameExists() {
        return ''
    }

    // TODO: Returns list By Id
    async getListById({ id }) {
        return ''
    }

    // Function to insert into the DB
    async insertCustomList({ name, isDeletable = 1, isNestable = 1 }) {
        await this.storageManager.putObject(COLLECTION_NAME, {
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
        await Promise.resolve()
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
        // await this.storageManager.deletetObject(PAGE_LIST_ENTRY, {
        //     listId,
        //     pageUrl,
        // })
    }
}
