const last = require('lodash/last')
const pickBy = require('lodash/pickBy')
import * as AllRaven from 'raven-js'
import { EventEmitter } from 'events'
import { StorageManager } from '../../../search/storage/manager'
import BackupStorage, { LastBackupStorage } from '../storage'
import { BackupBackend } from '../backend'
import { ObjectChangeBatch } from '../backend/types'
import { isExcludedFromBackup } from '../utils'

export interface BackupProgressInfo {
    state: 'preparing' | 'synching' | 'paused' | 'cancelled'
    totalChanges: number
    processedChanges: number
    // currentCollection: string
    // collections: {
    //     [name: string]: { totalObjects: number; processedObjects: number }
    // }
}

export default class BackupProcedure {
    storageManager: StorageManager
    storage: BackupStorage
    backend: BackupBackend
    lastBackupStorage: LastBackupStorage
    currentSchemaVersion: number

    running: boolean
    completionPromise?: Promise<void> // only set after first run

    info: BackupProgressInfo
    events: EventEmitter

    pausePromise?: Promise<null> // only set if paused, resolved when pause ends
    resolvePausePromise?: () => void // only set if paused

    constructor({
        storageManager,
        storage,
        lastBackupStorage,
        backend,
    }: {
        storageManager: StorageManager
        storage: BackupStorage
        lastBackupStorage: LastBackupStorage
        backend: BackupBackend
    }) {
        this.storageManager = storageManager
        this.storage = storage
        this.lastBackupStorage = lastBackupStorage
        this.backend = backend
        this.currentSchemaVersion = getCurrentSchemaVersion(storageManager)
        this.reset()
    }

    reset() {
        this.running = false
        this.info = null
        this.events = null
    }

    pause() {
        if (!this.info || this.info.state !== 'synching') {
            return
        }

        this.info.state = 'paused'
        this.pausePromise = new Promise(resolve => {
            this.resolvePausePromise = resolve
        })
        this.events.emit('info', this.info)
    }

    resume() {
        if (!this.info || this.info.state !== 'paused') {
            return
        }

        this.info.state = 'synching'
        this.pausePromise = null
        this.resolvePausePromise()
        this.resolvePausePromise = null
        this.events.emit('info', this.info)
    }

    async cancel() {
        this.events = null
        this.info.state = 'cancelled'
        await this.completionPromise
        await new Promise(resolve => {
            setTimeout(resolve, 1000)
        })
    }

    run() {
        this.running = true
        this.events = new EventEmitter()
        this.info = {
            state: 'preparing',
            totalChanges: null,
            processedChanges: null,
        }

        let resolveCompletionPromise
        this.completionPromise = new Promise(resolve => {
            resolveCompletionPromise = resolve
        })

        const procedure = async () => {
            const lastBackupTime = await this.lastBackupStorage.getLastBackupTime()

            await this.backend.startBackup({ events: this.events })
            if (!lastBackupTime) {
                console.log(
                    'no last backup found, putting everything in backup table',
                )
                console.time('put initial backup into changes table')

                try {
                    this.events.emit('info', this.info)
                    await this.storage.forgetAllChanges()
                    await this._queueInitialBackup() // Pushes all the objects in the DB to the queue for the incremental backup
                } catch (err) {
                    throw err
                } finally {
                    console.timeEnd('put initial backup into changes table')
                }
            }

            const backupTime = new Date()
            await this._doIncrementalBackup(backupTime, this.events)
            if (process.env.STORE_BACKUP_TIME !== 'false') {
                await this.lastBackupStorage.storeLastBackupTime(backupTime)
            }
        }

        setTimeout(async () => {
            procedure()
                .then(() => {
                    this.running = false
                    if (this.events) {
                        this.events.emit('success')
                    }
                    this.reset()
                    resolveCompletionPromise()
                })
                .catch(e => {
                    this.running = false

                    if (process.env.NODE_ENV === 'production') {
                        const raven = AllRaven['default']
                        raven.captureException(e)
                    }

                    console.error(e)
                    console.error(e.stack)
                    if (this.events) {
                        this.events.emit('fail', e)
                    }
                    this.reset()
                    resolveCompletionPromise()
                })
        }, 200)
    }

    async _queueInitialBackup() {
        const collectionsWithVersions = this._getCollectionsToBackup()

        for (const collection of collectionsWithVersions) {
            for await (const pk of this.storageManager.streamPks(
                collection.name,
            )) {
                await this.storage.registerChange({
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
        const info = (this.info = await this._createBackupInfo(
            collectionsWithVersions,
            untilWhen,
        ))
        events.emit('info', { info })

        for await (const batch of this.storage.streamChanges(untilWhen, {
            batchSize: parseInt(process.env.BACKUP_BATCH_SIZE, 10),
        })) {
            if (this.info.state === 'paused') {
                await this.pausePromise
            }
            if (this.info.state === 'cancelled') {
                break
            }

            await this._backupChanges(batch, info, events)
            events.emit('info', { info })
        }

        console.log('finished incremental backup')
    }

    _backupChanges = async (
        batch: ObjectChangeBatch,
        info: BackupProgressInfo,
        events,
    ) => {
        // console.log('preparing batch')
        for (const change of batch.changes) {
            const object = pickBy(
                await this.storageManager.findByPk(
                    change.collection,
                    change.objectPk,
                ),
                (val, key) => {
                    return key !== 'terms' && key.indexOf('_terms') === -1
                },
            )
            change.object = object
            // console.log('prepared change %o', change.object)
        }
        // console.log('prepared batch')

        // console.log('uploading batch')
        if (process.env.MOCK_BACKUP_BACKEND === 'true') {
            await new Promise(resolve => setTimeout(resolve, 500))
        } else {
            await this.backend.backupChanges({
                changes: batch.changes,
                events,
                currentSchemaVersion: this.currentSchemaVersion,
                options: { storeBlobs: _shouldStoreBlobs() },
            })
        }
        // console.log('uploaded batch, removing affected items from log')
        await batch.forget()
        // console.log('removed from log')

        info.processedChanges += batch.changes.length
        // info.collections[change.collection].processedObjects += 1
    }

    _getCollectionsToBackup(): { name: string; version: Date }[] {
        return Object.entries(this.storageManager.registry.collections)
            .filter(([key, value]) => !isExcludedFromBackup(value))
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
            totalChanges: 0,
            processedChanges: 0,
            // collections: {},
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
            // info.collections[collectionName] = {
            //     `totalObject`s,
            //     processedObjects: 0,
            // }
            info.totalChanges += totalObjects as number
        }

        return info
    }
}

export function _shouldStoreBlobs() {
    const pref = localStorage.getItem('backup.save-blobs')
    return pref !== 'false'
}

export function getCurrentSchemaVersion(storageManager: StorageManager) {
    const schemaVersions = Object.keys(
        storageManager.registry.collectionsByVersion,
    ).map(version => parseInt(version, 10))
    schemaVersions.sort()
    return last(schemaVersions)
}
