import Storex from '@worldbrain/storex'
import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'
import {
    COLLECTION_DEFINITIONS,
    COLLECTION_NAMES,
} from '@worldbrain/memex-storage/lib/backup-changes/constants'

import { ObjectChangeBatch } from './backend/types'
import { isExcludedFromBackup } from './utils'
import setupChangeTracking from 'src/backup-restore/background/change-hooks'

export default class BackupStorage extends StorageModule {
    static BACKUP_COLL = COLLECTION_NAMES.backupChange

    recordingChanges: boolean = false
    private storageManager: Storex

    constructor({ storageManager }) {
        super({ storageManager })
        this.storageManager = storageManager
    }

    getConfig = (): StorageModuleConfig => ({
        collections: {
            ...COLLECTION_DEFINITIONS,
        },
        operations: {
            findBackupChanges: {
                collection: BackupStorage.BACKUP_COLL,
                operation: 'findObjects',
                args: [{}, { limit: '$limit:int' }],
            },
            createBackupChange: {
                collection: BackupStorage.BACKUP_COLL,
                operation: 'createObject',
            },
            deleteBackupChanges: {
                collection: BackupStorage.BACKUP_COLL,
                operation: 'deleteObjects',
                args: {
                    timestamp: { $in: '$pks:int' },
                },
            },
            deleteAllBackupChanges: {
                collection: BackupStorage.BACKUP_COLL,
                operation: 'deleteObjects',
                args: {},
            },
            countBackupChanges: {
                collection: BackupStorage.BACKUP_COLL,
                operation: 'countObjects',
                args: {
                    collection: '$collectionName:string',
                    timestamp: { $lte: '$timestamp:int' },
                },
            },
        },
    })

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

    setupChangeTracking() {
        setupChangeTracking(
            this.storageManager,
            this._handleStorageChange.bind(this),
        )
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
        await this.operation('createBackupChange', {
            timestamp: Date.now(),
            collection,
            objectPk: pk,
            operation,
        })
    }

    startRecordingChanges() {
        this.recordingChanges = true
    }

    stopRecordingChanges() {
        this.recordingChanges = false
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
                await this.operation('deleteBackupChanges', { pks })
            },
        }

        // Explicit variable with while loop prevents fighting and confusing with nested breaks
        let running = true
        while (running) {
            changes = await this.operation('findBackupChanges', {
                limit: batchSize,
            })
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
        return this.operation('countBackupChanges', {
            collectionName,
            timestamp: until.getTime(),
        })
    }

    async forgetAllChanges() {
        await this.operation('deleteAllBackupChanges', {})
    }
}

export type BackupInfoKey =
    | 'lastBackup'
    | 'lastBackupFinish'
    | 'lastProblemNotifShown'
export interface BackupInfoStorage {
    storeDate(key: BackupInfoKey, time: Date): Promise<void>
    retrieveDate(key: BackupInfoKey): Promise<Date | null>

    clear(): Promise<void>
}

export class LocalBackupInfoStorage implements BackupInfoStorage {
    // constructor(private localStorage: {
    //     setItem(key: string, value: string): void,
    //     getItem(key: string): Promise<string>
    // }) {

    // }

    async storeDate(key: BackupInfoKey, time: Date) {
        localStorage.setItem(key, time ? JSON.stringify(time.getTime()) : null)
    }

    async retrieveDate(key: BackupInfoKey): Promise<Date | null> {
        const value = localStorage.getItem(key)
        if (!value) {
            return null
        }
        return new Date(JSON.parse(value))
    }

    async clear() {
        const keys: { [Key in BackupInfoKey]: true } = {
            lastBackup: true,
            lastBackupFinish: true,
            lastProblemNotifShown: true,
        }
        for (const key of Object.keys(keys)) {
            localStorage.removeItem(key)
        }
    }
}
