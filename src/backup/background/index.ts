import { EventEmitter } from 'events'
import { makeRemotelyCallable } from '../../util/webextensionRPC'
import { StorageManager } from '../../search/storage/manager'
import { setupRequestInterceptor } from './redirect'
import BackupStorage from './storage'
import { BackupBackend } from './backend'
export * from './backend'

export interface BackupProgressInfo {
    state: 'preparing' | 'synching'
    totalObjects: number
    processedObjects: number
    // currentCollection: string
    collections: {
        [name: string]: { totalObjects: number; processedObjects: number }
    }
}

export class BackupBackgroundModule {
    storageManager: StorageManager
    storage: BackupStorage
    backend: BackupBackend
    lastBackupStorage: LastBackupStorage
    recordingChanges: boolean = false

    constructor({
        storageManager,
        lastBackupStorage,
        backend,
    }: {
        storageManager: StorageManager
        lastBackupStorage: LastBackupStorage
        backend: BackupBackend
    }) {
        this.storageManager = storageManager
        this.storage = new BackupStorage({ storageManager })
        this.lastBackupStorage = lastBackupStorage
        this.backend = backend

        this.storageManager.on(
            'changing',
            ({
                collection,
                pk,
                operation,
            }: {
                collection: string
                pk: string
                operation: string
            }) => {
                if (this.recordingChanges) {
                    this.storage.registerChange({ collection, pk, operation })
                }
            },
        )
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(
            {
                getBackupProviderLoginLink: async (info, params) => {
                    const url = await this.backend.getLoginUrl(params)
                    return url
                },
                startBackup: ({ tab }, params) => {
                    const events = this.doBackup()
                    const sendEvent = (eventType, event) =>
                        window['browser'].tabs.sendMessage(tab.id, {
                            type: 'backup-event',
                            event: { type: eventType, ...(event || {}) },
                        })
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
            },
            { insertExtraArg: true },
        )
    }

    setupRequestInterceptor() {
        setupRequestInterceptor({
            webRequest: window['browser'].webRequest,
            handleLoginRedirectedBack: this.backend.handleLoginRedirectedBack.bind(
                this.backend,
            ),
            memexCloudOrigin: _getMemexCloudOrigin(),
        })
    }

    async startRecordingChangesIfNeeded() {
        if (
            !(await this.lastBackupStorage.getLastBackupTime()) ||
            this.recordingChanges
        ) {
            return
        }

        this.startRecordingChanges()
    }

    startRecordingChanges() {
        this.recordingChanges = true
    }

    doBackup() {
        const events = new EventEmitter()

        ;(async () => {
            this.startRecordingChanges()
            const lastBackupTime = await this.lastBackupStorage.getLastBackupTime()

            await this.backend.startBackup({ events })
            if (!lastBackupTime) {
                console.log(
                    'no last backup found, putting everything in backup table',
                )
                console.time('put initial backup into changes table')

                try {
                    events.emit('info', { info: { state: 'preparing' } })
                    await this.storage.forgetAllChanges()
                    await this._queueInitialBackup() // Pushes all the objects in the DB to the queue for the incremental backup
                } catch (err) {
                    throw err
                } finally {
                    console.timeEnd('put initial backup into changes table')
                }
            }

            const backupTime = new Date()
            await this._doIncrementalBackup(backupTime, events)
            await this.backend.commitBackup({ events })
            await this.lastBackupStorage.storeLastBackupTime(backupTime)
        })()
            .then(() => {
                events.emit('success')
            })
            .catch(e => {
                console.error(e)
                console.error(e.stack)
                events.emit('fail', e)
            })

        return events
    }

    async _queueInitialBackup() {
        const collectionsWithVersions = this._getCollectionsToBackup()

        for (const collection of collectionsWithVersions) {
            for await (const pk of this.storageManager.streamPks(
                collection.name,
            )) {
                this.storage.registerChange({
                    collection: collection.name,
                    pk,
                    operation: 'create',
                })
            }
        }
    }

    async _doIncrementalBackup(untilWhen: Date, events: EventEmitter) {
        console.log('starting incremental backup')

        const collectionsWithVersions = this._getCollectionsToBackup()
        const info = await this._createBackupInfo(
            collectionsWithVersions,
            untilWhen,
        )
        for await (const change of this.storage.streamChanges(untilWhen)) {
            await this._backupChange(change, events)
            await change.forget()

            info.processedObjects += 1
            info.collections[change.collection].processedObjects += 1
            events.emit('info', { info })
        }

        console.log('finished incremental backup')
    }

    _backupChange = async (change, events) => {
        if (change.operation !== 'delete') {
            const object = await this.storageManager.findByPk(
                change.collection,
                change.objectPk,
            )
            await this.backend.storeObject({
                collection: change.collection,
                pk: change.objectPk,
                object,
                events,
            })
        } else {
            await this.backend.deleteObject({
                collection: change.collection,
                pk: change.objectPk,
                events,
            })
        }
    }

    _getCollectionsToBackup(): { name: string; version: Date }[] {
        return Object.entries(this.storageManager.registry.collections)
            .filter(([key, value]) => value.backup !== false)
            .map(([key, value]) => ({
                name: key,
                version: value.version,
            }))
    }

    async _createBackupInfo(
        collections: { name: string }[],
        until: Date,
    ): Promise<BackupProgressInfo> {
        const info: BackupProgressInfo = {
            state: 'synching',
            totalObjects: 0,
            processedObjects: 0,
            collections: {},
        }

        const collectionCountPairs = (await Promise.all(
            collections.map(async ({ name }) => {
                return [
                    name,
                    await this.storage.countQueuedChangesByCollection(
                        name,
                        until,
                    ),
                ]
            }),
        )) as [string, number][]

        for (const [collectionName, totalObjects] of collectionCountPairs) {
            console.log(
                'no. of queued changed to %s: %d',
                collectionName,
                totalObjects,
            )
            info.collections[collectionName] = {
                totalObjects,
                processedObjects: 0,
            }
            info.totalObjects += totalObjects as number
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
    if (
        process.env.NODE_ENV !== 'production' &&
        process.env.LOCAL_AUTH_SERVICE === 'true'
    ) {
        return 'http://localhost:3002'
    } else {
        return 'https://memex.cloud'
    }
}
