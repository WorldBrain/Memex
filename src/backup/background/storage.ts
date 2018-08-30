import { FeatureStorage, CollectionDefinitions } from '../../search/storage'
import { StorageManager } from '../../search/storage/manager'

export default class BackupStorage extends FeatureStorage {
    collections: { [name: string]: CollectionDefinitions } = {
        backupChanges: [
            {
                version: new Date(2018, 7, 4),
                fields: {
                    timestamp: { type: 'datetime' },
                    collection: { type: 'string' },
                    objectPk: { type: 'string' },
                    operation: { type: 'string' }, // 'create'|'update'|'delete'
                },
                indices: [{ pk: true, field: 'timestamp' }],
                watch: false,
                backup: false,
            },
        ],
    }

    constructor({ storageManager }: { storageManager: StorageManager }) {
        super(storageManager)
        this.registerCollections()
    }

    registerChange({
        collection,
        pk,
        operation,
    }: {
        collection: string
        pk: string
        operation: string
    }) {
        console.log(
            'registering change to collection',
            collection,
            'with pk',
            pk,
        )

        this.storageManager.putObject('backupChanges', {
            timestamp: new Date(),
            collection,
            objectPk: pk,
            operation,
        })
    }

    async *streamChanges(until: Date) {
        let changes
        do {
            changes = await this.storageManager.findAll(
                'backupChanges',
                {},
                { limit: 50 },
            )
            for (const change of changes) {
                if (change.timestamp.getTime() > until.getTime()) {
                    break
                }

                yield {
                    ...change,
                    forget: async () => {
                        await this.storageManager.deleteObject(
                            'backupChanges',
                            change,
                        )
                    },
                }
            }
        } while (changes.length > 0)
    }

    async countQueuedChangesByCollection(collectionName: string, until: Date) {
        return this.storageManager.countAll(collectionName, {
            timestamp: { $lte: until },
        })
    }

    async forgetAllChanges() {
        await this.storageManager.deleteObject('backupChanges', {})
    }
}
