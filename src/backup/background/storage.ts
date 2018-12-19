import { CollectionDefinitions } from 'storex'

import { FeatureStorage } from '../../search/storage'
import { StorageManager } from '../../search/types'
import { ObjectChangeBatch } from './backend/types'
import { isExcludedFromBackup } from './utils'
import setupChangeTracking from 'src/backup/background/change-hooks'

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

    recordingChanges: boolean = false

    constructor({ storageManager }: { storageManager: StorageManager }) {
        super(storageManager)
        this.registerCollections()

        setupChangeTracking(
            storageManager,
            this._handleStorageChange.bind(this),
        )
    }

    _handleStorageChange({
        collection,
        pk,
        operation,
    }: {
        collection: string
        pk: string
        operation: string
    }) {
        if (!this.recordingChanges) {
            return
        }

        const collectionDefinition = this.storageManager.registry.collections[
            collection
        ]
        if (!isExcludedFromBackup(collectionDefinition)) {
            this.registerChange({
                collection,
                pk,
                operation,
            })
        }
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

    startRecordingChanges() {
        this.recordingChanges = true
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

    getLastBackupFinishTime(): Promise<Date>
    storeLastBackupFinishTime(time: Date): Promise<any>
}

export class LocalLastBackupStorage implements LastBackupStorage {
    private key: string

    constructor({ key }: { key: string }) {
        this.key = key
    }

    async getLastBackupTime() {
        return this._getTime(this.key)
    }

    async storeLastBackupTime(time: Date) {
        await this._setDate(this.key, time)
    }

    async getLastBackupFinishTime() {
        return this._getTime(`${this.key}Finish`)
    }

    async storeLastBackupFinishTime(time: Date) {
        await this._setDate(`${this.key}Finish`, time)
    }

    async _getTime(key) {
        const value = localStorage.getItem(key)
        if (!value) {
            return null
        }
        return new Date(JSON.parse(value))
    }

    async _setDate(key, date) {
        localStorage.setItem(key, date ? JSON.stringify(date.getTime()) : null)
    }
}
