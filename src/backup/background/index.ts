import { EventEmitter } from 'events'
import { makeRemotelyCallable } from '../../util/webextensionRPC'
import { StorageManager } from "../../search/search-index-new/storage/manager"
import { setupRequestInterceptor } from './redirect'
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
            if (this.recordingChanges) {
                this.storage.registerChange({ collection, pk, operation })
            }
        })
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            getBackupProviderLoginLink: async (info, params) => {
                const url = await this.backend.getLoginUrl(params)
                return url
            },
            startBackup: ({ tab }, params) => {
                const events = this.doBackup()
                const sendEvent = (eventType, event) => window['browser'].tabs.sendMessage(
                    tab.id,
                    {
                        type: 'backup-event', event: { type: eventType, ...(event || {}) },
                    }
                )
                events.on('info', event => sendEvent('info', event))
                events.on('fail', event => sendEvent('info', event))
                events.on('success', event => sendEvent('info', event))
            },
            isBackupAuthenticated: async (info, params) => {
                return this.backend.isAuthenticated()
            },
            isBackupConnected: async (info, params) => {
                return this.backend.isConnected()
            },
        }, { insertExtraArg: true })
    }

    setupRequestInterceptor() {
        setupRequestInterceptor({
            webRequest: window['browser'].webRequest,
            handleLoginRedirectedBack: this.backend.handleLoginRedirectedBack.bind(this.backend)
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
            // TODO:         Added null && for debugging purposes, remove!!!!!
            const lastBackupTime = null && await this.lastBackupStorage.getLastBackupTime()
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
                    await change.forget()
                }
            } else { // Just back up everything
                console.log('found collections', Object.keys(this.storageManager.registry.collections))

                const collectionNames =
                    Object.keys(this.storageManager.registry.collections)
                        .filter(key => key !== 'backupChanges')

                const collectionCountPairs = await Promise.all(collectionNames.map(async collectionName => {
                    return [collectionName, await this.storageManager.countAll(collectionName, {})]
                }))

                const info = { type: 'complete', totalObjects: 0, processedObjects: 0, currentCollection: null, collections: {} }
                for (const [collectionName, objectCount] of collectionCountPairs) {
                    info.collections[collectionName] = { objectCount }
                    info.totalObjects += <number>objectCount
                }

                events.emit('info', { info })

                for (const collectionName of collectionNames) {
                    info.currentCollection = { name: collectionName, processedObjects: 0 }
                    events.emit('info', { info })

                    console.log('backing up collection', collectionName)
                    for await (const { pk, object } of this.storageManager.streamCollection(collectionName)) {
                        // console.log('backing up %s - %s', collectionName, pk)
                        await this.backend.storeObject({ collection: collectionName, pk, object, events })
                        info.processedObjects += 1
                        info.currentCollection.processedObjects += 1
                        events.emit('info', { info })
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
