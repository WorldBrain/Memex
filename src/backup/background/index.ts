import { EventEmitter } from 'events'
import { StorageManager } from "../../search/search-index-new/storage/manager"
import BackupStorage from './storage'
import { BackupBackend } from './backend'


export default class BackupBackgroundModule {
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
    }

    startRecordingChangesIfNeeded() {
        if (!this.lastBackupStorage.getLastBackupTime() || this.recordingChanges) {
            return
        }

        this.startRecordingChanges()
        this.recordingChanges = true
    }

    startRecordingChanges() {
        this.storageManager.on('change', ({ collection, pk, operation }: { collection: string, pk: string, operation: string }) => {
            this.storage.registerChange({ collection, pk, operation })
        })
    }

    doBackup() {
        const lastBackupTime = this.lastBackupStorage.getLastBackupTime()
        const backupTime = new Date()
        this.lastBackupStorage.storeLastBackupTime(backupTime)
        this.startRecordingChangesIfNeeded()

        this.backend.startBackup()
        const emitter = new EventEmitter()

        let writeChanges
        if (lastBackupTime) { // Already one backup has been made, so make incremental one
            writeChanges = (async () => {
                for await (const change of this.storage.streamChanges(backupTime)) {
                    if (change.operation !== 'delete') {
                        const object = this.storageManager.findByPk(change.collection, change.pk)
                        await this.backend.storeObject({ collection: change.collection, pk: change.pk, object })
                    } else {
                        await this.backend.deleteObject(change)
                    }
                }
            })
        } else { // Just back up everything
            writeChanges = (async () => {
                for (const collectionName in this.storageManager.registry.collections) {
                    for await (const { pk, object } of this.storageManager.streamCollection(collectionName)) {
                        await this.backend.storeObject({ collection: collectionName, pk, object })
                    }
                }
            })
        }

        writeChanges()
            .then(() => {
                emitter.emit('changesWritten')
            })
            .catch(e => {
                emitter.emit('fail')
            })

        emitter.on('changesWritten', () => {
            const commitEvents = this.backend.commitBackup()
            commitEvents.on('success', () => {
                emitter.emit('success')
            })
            commitEvents.on('fail', () => {
                emitter.emit('fail')
            })
        })

        return emitter
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
        return new Date(JSON.parse(localStorage.getItem(this.key)))
    }

    async storeLastBackupTime(time: Date) {
        localStorage.setItem(this.key, JSON.stringify(time.getTime()))
    }
}
