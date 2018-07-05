import { EventEmitter } from 'events'
import { StorageManager } from "../../search/search-index-new/storage/manager"
import BackupStorage from './storage'
import { BackupBackend } from './backend'
export * from './backend'


export class BackupBackgroundModule {
    storageManager: StorageManager
    storage: BackupStorage
    backend: BackupBackend
    lastBackupStorage: LastBackupStorage
    recordingChanges: boolean = false

    constructor(
        { storageManager, lastBackupStorage, backend }:
            { storageManager: StorageManager, lastBackupStorage: LastBackupStorage, backend: BackupBackend }
    ) {
        this.storageManager = storageManager
        this.storage = new BackupStorage({ storageManager })
        this.lastBackupStorage = lastBackupStorage
        this.backend = backend

        this.storageManager.on('changing', ({ collection, pk, operation }: { collection: string, pk: string, operation: string }) => {
            console.log('change detected, we are interested', this.recordingChanges)
            if (this.recordingChanges) {
                this.storage.registerChange({ collection, pk, operation })
            }
        })
    }

    startRecordingChangesIfNeeded() {
        if (!this.lastBackupStorage.getLastBackupTime() || this.recordingChanges) {
            return
        }

        this.startRecordingChanges()
    }

    startRecordingChanges() {
        this.recordingChanges = true
    }

    doBackup() {
        const events = new EventEmitter();

        (async () => {
            this.startRecordingChanges()
            const lastBackupTime = await this.lastBackupStorage.getLastBackupTime()
            const backupTime = new Date()
            await this.lastBackupStorage.storeLastBackupTime(backupTime)

            await this.backend.startBackup({ events })

            if (lastBackupTime) { // Already one backup has been made, so make incremental one
                for await (const change of this.storage.streamChanges(backupTime)) {
                    if (change.operation !== 'delete') {
                        const object = await this.storageManager.findByPk(change.collection, change.pk)
                        await this.backend.storeObject({ collection: change.collection, pk: change.pk, object, events })
                    } else {
                        await this.backend.deleteObject({ ...change, events })
                    }
                }
            } else { // Just back up everything
                console.log('found collections', Object.keys(this.storageManager.registry.collections))

                for (const collectionName in this.storageManager.registry.collections) {
                    if (collectionName === 'backupChanges') {
                        continue
                    }

                    console.log('backing up collection', collectionName)
                    for await (const { pk, object } of this.storageManager.streamCollection(collectionName)) {
                        // console.log('backing up %s - %s', collectionName, pk)
                        await this.backend.storeObject({ collection: collectionName, pk, object, events })
                    }
                }
            }
        })().then(() => {
            events.emit('success')
        }).catch(e => {
            console.error(e)
            console.error(e.stack)
            events.emit('fail', e)
        })

        return events
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
