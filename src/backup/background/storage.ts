import { CollectionDefinitions } from 'storex'

import { FeatureStorage } from '../../search/storage'
import { StorageManager } from '../../search/types'
import { ObjectChangeBatch } from './backend/types'

export default class BackupStorage extends FeatureStorage {
    static BACKUP_COLL = 'backupChanges'

    collections: { [name: string]: CollectionDefinitions } = {
        backupChanges: [
            {
                version: new Date(2018, 11, 13),
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

    async registerChange({
        collection,
        pk,
        operation,
    }: {
        collection: string
        pk: string
        operation: string
    }) {
        // console.log(
        //     'registering change to collection',
        //     collection,
        //     'with pk',
        //     pk,
        // )

        await this.storageManager
            .collection(BackupStorage.BACKUP_COLL)
            .createObject({
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
                await this.storageManager
                    .collection(BackupStorage.BACKUP_COLL)
                    .deleteObjects({
                        timestamp: { $in: pks },
                    })
            },
        }

        // Explicit variable with while loop prevents fighting and confusing with nested breaks
        let running = true
        while (running) {
            changes = await this.storageManager
                .collection(BackupStorage.BACKUP_COLL)
                .findObjects({}, { limit: batchSize })
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
        return this.storageManager
            .collection(BackupStorage.BACKUP_COLL)
            .countObjects({
                collection: collectionName,
                timestamp: { $lte: until.getTime() },
            })
    }

    async forgetAllChanges() {
        await this.storageManager
            .collection(BackupStorage.BACKUP_COLL)
            .deleteObjects({})
    }
}

export interface LastBackupStorage {
    getLastBackupTime(): Promise<Date>
    storeLastBackupTime(time: Date): Promise<any>
}

export class LocalLastBackupStorage implements LastBackupStorage {
    private key: string

    constructor({ key }: { key: string }) {
        this.key = key
    }

    async getLastBackupTime() {
        const value = localStorage.getItem(this.key)
        if (!value) {
            return null
        }
        return new Date(JSON.parse(value))
    }

    async storeLastBackupTime(time: Date) {
        localStorage.setItem(this.key, JSON.stringify(time.getTime()))
    }
}
