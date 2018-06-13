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

    // Function to insert into the DB
    async insertCustomList({ name, isDeletable = 1, isNestable = 1 }) {
        await this.storageManager.putObject(COLLECTION_NAME, {
            name,
            isDeletable,
            isNestable,
            createdAt: new Date(),
        })
    }

    async insertPageToList({ listId, pageUrl = true }) {
        await this.storageManager.putObject(PAGE_LIST_ENTRY, {
            listId,
            pageUrl,
            createdAt: new Date(),
        })
    }
}
