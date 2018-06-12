import { FeatureStorage } from '../../search/search-index-new'

const COLLECTION_NAME: string = 'customLists'

export default class CustomListStorage extends FeatureStorage {
    constructor(storageManager) {
        super(storageManager)

        // TODO: Name it lists instead of suctom lists
        this.storageManager.registerCollection(COLLECTION_NAME, {
            // different version for adding a new table.
            version: new Date(2018, 6, 12),
            fields: {
                '++id': { type: 'string', pk: true },
                title: { type: 'text' },
                isDeletable: { type: 'binary' },
                isNestable: { type: 'binary' },
                createdAt: { type: 'datetime' },
            },
            indices: ['++id', 'title', 'isDeletable', 'createdAt'],
        })
    }

    // Function to insert into the DB
    async insertCustomList({ title, isDeletable = true, isNestable = true, body, selector }) {
        await this.storageManager.putObject(COLLECTION_NAME, {
            title,
            isDeletable,
            isNestable,
            createdAt: new Date(),
        })
    }
}
