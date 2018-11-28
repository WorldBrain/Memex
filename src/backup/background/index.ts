import { EventEmitter } from 'events'
import * as AllRaven from 'raven-js'
import { CollectionDefinition } from 'storex'

import getDb from '../../search'
import { StorageManager } from '../../search/types'
import { makeRemotelyCallable } from '../../util/webextensionRPC'
import { setupRequestInterceptors } from './redirect'
import BackupStorage, { LastBackupStorage } from './storage'
import { BackupBackend } from './backend'
import { ObjectChangeBatch } from './backend/types'
import estimateBackupSize from './estimate-backup-size'
import setupChangeTracking from './change-hooks'
const pickBy = require('lodash/pickBy')
const last = require('lodash/last')

export * from './backend'

export interface BackupProgressInfo {
    state: 'preparing' | 'synching' | 'paused' | 'cancelled'
    totalChanges: number
    processedChanges: number
    // currentCollection: string
    // collections: {
    //     [name: string]: { totalObjects: number; processedObjects: number }
    // }
}

export interface BackupState {
    running: boolean
    completionPromise?: Promise<void> // only set after first run

    info: BackupProgressInfo
    events: EventEmitter

    pausePromise?: Promise<null> // only set if paused, resolved when pause ends
    resume?: () => void // only set if paused
}

export class BackupBackgroundModule {
    storageManager: StorageManager
    storage: BackupStorage
    currentSchemaVersion: number
    backend: BackupBackend
    lastBackupStorage: LastBackupStorage
    recordingChanges: boolean = false
    state: BackupState
    uiTabId?: any
    automaticBackupCheck?: Promise<boolean>
    automaticBackupTimeout?: any
    automaticBackupEnabled?: boolean
    scheduledAutomaticBackupTimestamp?: number

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

        const schemaVersions = Object.keys(
            storageManager.registry.collectionsByVersion,
        ).map(version => parseInt(version, 10))
        schemaVersions.sort()
        this.currentSchemaVersion = last(schemaVersions)
        this.resetBackupState()

        setupChangeTracking(
            this.storageManager,
            getDb,
            ({ collection, pk, operation }) => {
                if (this.recordingChanges) {
                    const collectionDefinition = this.storageManager.registry
                        .collections[collection]
                    if (!isExcludedFromBackup(collectionDefinition)) {
                        this.storage.registerChange({
                            collection,
                            pk,
                            operation,
                        })
                    }
                }
            },
        )
    }

    private resetBackupState() {
        this.state = { running: false, info: null, events: null }
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(
            {
                getBackupProviderLoginLink: async (info, params) => {
                    const url = await this.backend.getLoginUrl(params)
                    return url
                },
                startBackup: ({ tab }, params) => {
                    this.uiTabId = tab.id
                    if (this.state.running) {
                        return
                    }

                    this.doBackup()
                    const sendEvent = (eventType, event) => {
                        try {
                            window['browser'].tabs.sendMessage(this.uiTabId, {
                                type: 'backup-event',
                                event: { type: eventType, ...(event || {}) },
                            })
                        } catch (e) {
                            // ignore the error, user closed tab
                        }
                    }
                    this.state.events.on('info', event =>
                        sendEvent('info', event),
                    )
                    this.state.events.on('fail', event =>
                        sendEvent('fail', event),
                    )
                    this.state.events.on('success', event =>
                        sendEvent('success', event),
                    )
                },
                pauseBackup: () => {
                    if (!this.state || this.state.info.state !== 'synching') {
                        return
                    }

                    this.state.info.state = 'paused'
                    this.state.pausePromise = new Promise(resolve => {
                        this.state.resume = resolve
                    })
                    this.state.events.emit('info', this.state.info)
                },
                resumeBackup: () => {
                    if (this.state.info.state !== 'paused') {
                        return
                    }

                    this.state.info.state = 'synching'
                    this.state.pausePromise = null
                    this.state.resume()
                    this.state.resume = null
                    this.state.events.emit('info', this.state.info)
                },
                cancelBackup: async () => {
                    this.state.events = null
                    this.state.info.state = 'cancelled'
                    await this.state.completionPromise
                    await new Promise(resolve => {
                        setTimeout(resolve, 1000)
                    })
                },
                hasInitialBackup: async () => {
                    return !!(await this.lastBackupStorage.getLastBackupTime())
                },
                isBackupAuthenticated: async () => {
                    return this.backend.isAuthenticated()
                },
                isBackupConnected: async () => {
                    return this.backend.isConnected()
                },
                maybeCheckAutomaticBakupEnabled: async () => {
                    if (
                        !!(await this.lastBackupStorage.getLastBackupTime()) &&
                        localStorage.getItem('wp.user-id') &&
                        localStorage.getItem('backup.has-subscription') &&
                        localStorage.getItem('nextBackup') === null
                    ) {
                        await this.checkAutomaticBakupEnabled()
                        await this.maybeScheduleAutomaticBackup()
                    }
                },
                checkAutomaticBakupEnabled: async () => {
                    // The only place this is called right now is post-purchase.
                    // Move to more suitable place once this changes.
                    const override =
                        process.env.AUTOMATIC_BACKUP_PAYMENT_SUCCESS
                    if (override && override.length) {
                        console.log(
                            'Automatic backup payment override',
                            override,
                        )
                        this.automaticBackupCheck = Promise.resolve(
                            override === 'true',
                        )
                    } else {
                        await this.checkAutomaticBakupEnabled()
                    }

                    return this.automaticBackupCheck
                },
                isAutomaticBackupEnabled: async () => {
                    return this.isAutomaticBackupEnabled()
                },
                getBackupInfo: () => {
                    return this.state.info
                },
                estimateInitialBackupSize: () => {
                    return this.estimateInitialBackupSize()
                },
                setBackupBlobs: (info, saveBlobs) => {
                    localStorage.setItem('backup.save-blobs', saveBlobs)
                },
                getBackupTimes: async () => {
                    const lastBackup = await this.lastBackupStorage.getLastBackupTime()
                    let nextBackup = null
                    if (this.state.running) {
                        nextBackup = 'running'
                    } else if (await this.isAutomaticBackupEnabled()) {
                        nextBackup = new Date(
                            this.scheduledAutomaticBackupTimestamp,
                        )
                    }
                    const times = {
                        lastBackup: lastBackup && lastBackup.getTime(),
                        nextBackup:
                            nextBackup && nextBackup.getTime
                                ? nextBackup.getTime()
                                : nextBackup,
                    }
                    return times
                },
                storeWordpressUserId: (info, userId) => {
                    localStorage.setItem('wp.user-id', userId)
                },
            },
            { insertExtraArg: true },
        )
    }

    setupRequestInterceptor() {
        setupRequestInterceptors({
            webRequest: window['browser'].webRequest,
            handleLoginRedirectedBack: this.backend.handleLoginRedirectedBack.bind(
                this.backend,
            ),
            checkAutomaticBakupEnabled: () => this.checkAutomaticBakupEnabled(),
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
        this.maybeScheduleAutomaticBackup()
    }

    startRecordingChanges() {
        this.recordingChanges = true
    }

    isAutomaticBackupEnabled({ forceCheck = false } = {}) {
        if (!forceCheck && this.automaticBackupCheck) {
            return this.automaticBackupCheck
        }

        const override = process.env.AUTOMATIC_BACKUP
        if (override) {
            console.log('Automatic backup override:', override)
            return override === 'true'
        }

        if (!localStorage.getItem('wp.user-id')) {
            return false
        }

        return this.checkAutomaticBakupEnabled()
    }

    checkAutomaticBakupEnabled() {
        this.automaticBackupCheck = (async () => {
            const wpUserId = localStorage.getItem('wp.user-id')
            if (!wpUserId) {
                return false
            }

            let hasSubscription
            let endDate
            try {
                const subscriptionUrl = `${_getMemexCloudOrigin()}/subscriptions/automatic-backup?user=${wpUserId}`
                const response = await (await fetch(subscriptionUrl)).json()
                hasSubscription = response.active
                endDate = response.endDate
            } catch (e) {
                return true
            }

            localStorage.setItem('backup.has-subscription', hasSubscription)
            if (endDate !== undefined) {
                localStorage.setItem('backup.subscription-end-date', endDate)
            }

            return hasSubscription
        })()

        return this.automaticBackupCheck
    }

    async maybeScheduleAutomaticBackup() {
        if (await this.isAutomaticBackupEnabled()) {
            this.scheduleAutomaticBackup()
        }
    }

    scheduleAutomaticBackup() {
        this.automaticBackupEnabled = true
        if (this.automaticBackupTimeout || this.state.resume) {
            return
        }

        const msUntilNextBackup = 1000 * 60 * 15
        this.scheduledAutomaticBackupTimestamp = Date.now() + msUntilNextBackup
        this.automaticBackupTimeout = setTimeout(() => {
            this.doBackup()
        }, msUntilNextBackup)
    }

    estimateInitialBackupSize() {
        return estimateBackupSize({ storageManager: this.storageManager })
    }

    doBackup() {
        if (this.automaticBackupTimeout) {
            clearTimeout(this.automaticBackupTimeout)
            this.automaticBackupTimeout = null
        }

        this.state.running = true
        this.state.events = new EventEmitter()
        this.state.info = {
            state: 'preparing',
            totalChanges: null,
            processedChanges: null,
        }

        let resolveCompletionPromise
        this.state.completionPromise = new Promise(resolve => {
            resolveCompletionPromise = resolve
        })

        const procedure = async () => {
            this.startRecordingChanges()
            const lastBackupTime = await this.lastBackupStorage.getLastBackupTime()

            await this.backend.startBackup({ events: this.state.events })
            if (!lastBackupTime) {
                console.log(
                    'no last backup found, putting everything in backup table',
                )
                console.time('put initial backup into changes table')

                try {
                    this.state.events.emit('info', this.state.info)
                    await this.storage.forgetAllChanges()
                    await this._queueInitialBackup() // Pushes all the objects in the DB to the queue for the incremental backup
                } catch (err) {
                    throw err
                } finally {
                    console.timeEnd('put initial backup into changes table')
                }
            }

            const backupTime = new Date()
            await this._doIncrementalBackup(backupTime, this.state.events)
            if (process.env.STORE_BACKUP_TIME !== 'false') {
                await this.lastBackupStorage.storeLastBackupTime(backupTime)
            }
        }

        setTimeout(async () => {
            procedure()
                .then(() => {
                    this.state.running = false
                    if (this.state.events) {
                        this.state.events.emit('success')
                    }
                    this.resetBackupState()
                    this.maybeScheduleAutomaticBackup()
                    resolveCompletionPromise()
                })
                .catch(e => {
                    this.state.running = false

                    if (process.env.NODE_ENV === 'production') {
                        const raven = AllRaven['default']
                        raven.captureException(e)
                    }

                    console.error(e)
                    console.error(e.stack)
                    if (this.state.events) {
                        this.state.events.emit('fail', e)
                    }
                    this.resetBackupState()
                    this.maybeScheduleAutomaticBackup()
                    resolveCompletionPromise()
                })
        }, 200)

        return this.state.events
    }

    async _queueInitialBackup() {
        const collectionsWithVersions = this._getCollectionsToBackup()

        for (const collection of collectionsWithVersions) {
            for await (const pk of this.storageManager
                .collection(collection.name)
                .streamPks()) {
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
        const info = (this.state.info = await this._createBackupInfo(
            collectionsWithVersions,
            untilWhen,
        ))
        events.emit('info', { info })

        for await (const batch of this.storage.streamChanges(untilWhen, {
            batchSize: parseInt(process.env.BACKUP_BATCH_SIZE, 10),
        })) {
            if (this.state.info.state === 'paused') {
                await this.state.pausePromise
            }
            if (this.state.info.state === 'cancelled') {
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
                await this.storageManager
                    .collection(change.collection)
                    .findByPk(change.objectPk),
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

export function isExcludedFromBackup(collectionDef: CollectionDefinition) {
    return collectionDef.backup === false
}

export function _shouldStoreBlobs() {
    const pref = localStorage.getItem('backup.save-blobs')
    return pref !== 'false'
}
