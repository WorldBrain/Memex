import { EventEmitter } from 'events'
import { makeRemotelyCallable } from '../../util/webextensionRPC'
import { StorageManager } from "../../search/search-index-new/storage/manager"
import { setupRequestInterceptor } from './redirect'
import BackupStorage from './storage'
import { BackupBackend } from './backend'
export * from './backend'


export interface CompleteBackupProgressInfo {
    type: 'complete'
    totalObjects: number
    processedObjects: number
    currentCollection: { name: string, processedObjects: number }
    collections: { [name: string]: { objectCount: number } }
}


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
                return await this.backend.isAuthenticated()
            },
            isBackupConnected: async (info, params) => {
                return await this.backend.isConnected()
            },
        }, { insertExtraArg: true })
    }

    setupRequestInterceptor() {
        setupRequestInterceptor({
            webRequest: window['browser'].webRequest,
            handleLoginRedirectedBack: this.backend.handleLoginRedirectedBack.bind(this.backend),
            memexCloudOrigin: _getMemexCloudOrigin()
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
                await this._doIncrementalBackup(backupTime, events)
            } else { // Just back up everything
                await this._doCompleteBackup(events)
            }
            await this.backend.commitBackup({ events })
        })().then(() => {
            events.emit('success')
        }).catch(e => {
            console.error(e)
            console.error(e.stack)
            events.emit('fail', e)
        })

        return events
    }

    async _doIncrementalBackup(untilWhen: Date, events: EventEmitter) {
        const info = {
            type: 'incremental',
            totalObjects: await this.storageManager.countAll('backupChanges', {}),
            processedObjects: 0,
        }
        for await (const change of this.storage.streamChanges(untilWhen)) {
            await this._backupChange(change, events)
            await change.forget()

            info.processedObjects += 1
            events.emit('info', { info })
        }
    }

    _backupChange = async (change, events) => {
        if (change.operation !== 'delete') {
            const object = await this.storageManager.findByPk(change.collection, change.objectPk)
            await this.backend.storeObject({ collection: change.collection, pk: change.objectPk, object, events })
        } else {
            await this.backend.deleteObject({ collection: change.collection, pk: change.objectPk, events })
        }
    }

    async _doCompleteBackup(events: EventEmitter) {
        const collections = this._getCollectionsToBackup()

        console.log('Found collections to backup', collections)

        const info: CompleteBackupProgressInfo = await this._createCompleteBackupInfo(collections)
        events.emit('info', { info })

        for (const collection of collections) {
            info.currentCollection = { name: collection.name, processedObjects: 0 }
            events.emit('info', { info })

            console.log('Backing up collection', collection.name)
            for await (const { pk, object } of this.storageManager.streamCollection(collection.name)) {
                // console.log('backing up %s - %s', collectionName, pk)
                await this.backend.storeObject({ collection: collection.name, pk, object: { object, schemaVersion: collection.version }, events })
                info.processedObjects += 1
                info.currentCollection.processedObjects += 1
                events.emit('info', { info })
            }
        }
    }

    _getCollectionsToBackup(): { name: string, version: Date }[] {
        return Object.entries(this.storageManager.registry.collections)
            .filter(([key, value]) => value.backup !== false)
            .map(([key, value]) => ({
                name: key,
                version: value.version
            }))
    }

    async _createCompleteBackupInfo(collections: { name: string }[]): Promise<CompleteBackupProgressInfo> {
        const info: CompleteBackupProgressInfo = { type: 'complete', totalObjects: 0, processedObjects: 0, currentCollection: null, collections: {} }

        const collectionCountPairs = <[string, number][]>await Promise.all(collections.map(async ({ name }) => {
            return [name, await this.storageManager.countAll(name, {})]
        }))

        for (const [collectionName, objectCount] of collectionCountPairs) {
            info.collections[collectionName] = { objectCount }
            info.totalObjects += <number>objectCount
        }

        return info
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

export function _getMemexCloudOrigin() {
    if (process.env.NODE_ENV !== 'production' && process.env.LOCAL_AUTH_SERVICE === 'true') {
        return 'http://localhost:3002'
    } else {
        return 'https://memex.cloud'
    }
}

