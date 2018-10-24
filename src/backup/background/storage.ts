import { FeatureStorage, CollectionDefinitions } from '../../search/storage'
import { StorageManager } from '../../search/storage/manager'
import { ObjectChangeBatch } from './backend/types'

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
                indices: [
                    { pk: true, field: 'timestamp' },
                    { field: 'collection' },
                ],
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
            timestamp: Date.now(),
            collection,
            objectPk: pk,
            operation,
        })
    }

    async *streamChanges(
        until: Date,
        { batchSize }: { batchSize: number },
    ): AsyncIterableIterator<ObjectChangeBatch> {
        let changes
        const batch = {
            changes: [],
            forget: async () => {
                const pks = batch.changes.map(change => change['timestamp'])
                await this.storageManager.deleteObject('backupChanges', {
                    timestamp: { $in: pks },
                })
            },
        }

        // Explicit variable with while loop prevents fighting and confusing with nested breaks
        let running = true
        while (running) {
            changes = await this.storageManager.findAll(
                'backupChanges',
                {},
                { limit: batchSize },
            )
            if (!changes.length) {
                break
            }

            for (const change of changes) {
                if (change.timestamp > until.getTime()) {
                    running = false
                    break
                }

                batch.changes.push(change)
                if (batch.changes.length === batchSize) {
                    yield batch
                    batch.changes = []
                }
            }

            if (changes.length < batchSize) {
                break
            }
        }

        if (batch.changes.length) {
            yield batch
        }
    }

    async countQueuedChangesByCollection(collectionName: string, until: Date) {
        return this.storageManager.countAll('backupChanges', {
            collection: collectionName,
            timestamp: { $lte: until.getTime() },
        })
    }

    async forgetAllChanges() {
        await this.storageManager.deleteObject('backupChanges', {})
    }
}
