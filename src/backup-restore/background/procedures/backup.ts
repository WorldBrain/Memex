// tslint:disable:no-console
import type Storex from '@worldbrain/storex'
import * as Raven from 'src/util/raven'
import { EventEmitter } from 'events'

import type BackupStorage from '../storage'
import { BackupBackend, MemexLocalBackend } from '../backend'
import { ObjectChangeBatch } from '../backend/types'
import { isExcludedFromBackup } from '../utils'
import { DexieUtilsPlugin, BackupPlugin } from 'src/search/plugins'
import { getCurrentSchemaVersion } from '@worldbrain/memex-common/lib/storage/utils'
import type { BrowserSettingsStore } from 'src/util/settings'
import type { LocalBackupSettings } from '../types'
import { LOCAL_SERVER_ROOT } from 'src/backup-restore/ui/backup-pane/constants'

const pickBy = require('lodash/pickBy')

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
    storageManager: Storex
    storage: BackupStorage
    backend: BackupBackend
    pkmBackend: MemexLocalBackend
    currentSchemaVersion: number
    localBackupSettings: BrowserSettingsStore<LocalBackupSettings>

    running: boolean
    completionPromise?: Promise<void> // only set after first run

    info: BackupProgressInfo
    events: EventEmitter

    pausePromise?: Promise<void> // only set if paused, resolved when pause ends
    resolvePausePromise?: () => void // only set if paused

    constructor({
        localBackupSettings,
        storageManager,
        storage,
        backend,
    }: {
        localBackupSettings: BrowserSettingsStore<LocalBackupSettings>
        storageManager: Storex
        storage: BackupStorage
        backend: BackupBackend
    }) {
        this.localBackupSettings = localBackupSettings
        this.storageManager = storageManager
        this.storage = storage
        this.backend = backend
        this.pkmBackend = new MemexLocalBackend({
            url: LOCAL_SERVER_ROOT,
        })
        this.currentSchemaVersion = getCurrentSchemaVersion(
            storageManager,
        ).getTime()
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
        this.pausePromise = new Promise<void>((resolve) => {
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
        await this.storage.forgetAllChanges()
        await new Promise((resolve) => {
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
        this.completionPromise = new Promise((resolve) => {
            resolveCompletionPromise = resolve
        })

        const procedure = async () => {
            const lastBackupTime = await this.localBackupSettings.get(
                'lastBackup',
            )

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
                    Raven.captureException(err)
                    throw err
                } finally {
                    console.timeEnd('put initial backup into changes table')
                }
            }

            const backupTime = new Date()
            await this._doIncrementalBackup(backupTime, this.events)
            if (process.env.STORE_BACKUP_TIME !== 'false') {
                await this.localBackupSettings.set(
                    'lastBackup',
                    backupTime.toString(),
                )
            }
            await this.localBackupSettings.set(
                'lastBackupFinished',
                backupTime.toString(),
            )
        }

        setTimeout(async () => {
            procedure()
                .then(async () => {
                    this.running = false
                    if (this.events) {
                        this.events.emit('success')
                    }
                    // Set backup status for notification in search bar
                    await this.localBackupSettings.set(
                        'backupStatus',
                        'success',
                    )
                    await this.localBackupSettings.set(
                        'backupStatusId',
                        'success',
                    )

                    this.reset()
                    resolveCompletionPromise()
                })
                .catch(async (e) => {
                    this.running = false
                    if (process.env.NODE_ENV === 'production') {
                        Raven.captureException(e)
                    }

                    console.error(e)
                    console.error(e.stack)

                    // Set backup status for notification in search bar
                    const backupStatus = await this.localBackupSettings.get(
                        'backupStatus',
                    )

                    if (
                        backupStatus === 'success' ||
                        backupStatus === 'no_backup'
                    ) {
                        await this.localBackupSettings.set(
                            'backupStatus',
                            'fail',
                        )
                        await this.localBackupSettings.set(
                            'backupStatusId',
                            'backup_error',
                        )
                    }
                    if (this.events) {
                        this.events.emit('fail', e)
                    }
                    this.reset()
                    resolveCompletionPromise()
                })
        }, 200)
    }

    async _queueInitialBackup(chunkSize = 1000) {
        const collections = this._getCollectionsToBackup().map(
            (coll) => coll.name,
        )
        await this.storageManager.operation(BackupPlugin.QUEUE_CHANGES, {
            collections,
            chunkSize,
        })
    }

    async _doIncrementalBackup(untilWhen: Date, events: EventEmitter) {
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

        await this.localBackupSettings.remove('runningBackup')
    }

    _backupChanges = async (
        batch: ObjectChangeBatch,
        info: BackupProgressInfo,
        events,
    ) => {
        for (const change of batch.changes) {
            const object = pickBy(
                await this.storageManager.operation(
                    DexieUtilsPlugin.FIND_BY_PK_OP,
                    {
                        collection: change.collection,
                        pk: change.objectPk,
                    },
                ),
                (val, key) => {
                    return key !== 'terms' && key.indexOf('_terms') === -1
                },
            )
            change.object = object
        }
        if (process.env.MOCK_BACKUP_BACKEND === 'true') {
            await new Promise((resolve) => setTimeout(resolve, 500))
        } else {
            const shouldStoreBlobs = !!(await this.localBackupSettings.get(
                'saveBlobs',
            ))

            await this.pkmBackend.backupChanges({
                changes: batch.changes,
                events,
                currentSchemaVersion: this.currentSchemaVersion,
                options: { storeBlobs: shouldStoreBlobs },
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
