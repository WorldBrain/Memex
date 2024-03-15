// tslint:disable:no-console
import type Storex from '@worldbrain/storex'
import Queue, { Options as QueueOpts } from 'queue'

import { makeRemotelyCallable } from '../../util/webextensionRPC'
import BackupStorage from './storage'
import type { BackupBackend } from './backend'
import { BackendSelect } from './backend-select'
import estimateBackupSize from './estimate-backup-size'
import BackupProcedure from './procedures/backup'
import { BackupRestoreProcedure } from './procedures/restore'
import { ProcedureUiCommunication } from 'src/backup-restore/background/procedures/ui-communication'
import type NotificationBackground from 'src/notifications/background'
import { DEFAULT_AUTH_SCOPE } from './backend/google-drive'
import type { SearchIndex } from 'src/search'
import * as Raven from 'src/util/raven'
import type { BackupInterface, LocalBackupSettings } from './types'
import type { JobScheduler } from 'src/job-scheduler/background/job-scheduler'
import type { BrowserSettingsStore } from 'src/util/settings'
import { checkServerStatus } from '../../backup-restore/ui/utils'
import type { StorageOperationEvent } from '@worldbrain/storex-middleware-change-watcher/lib/types'

export * from './backend'

export class BackupBackgroundModule {
    storageManager: Storex
    searchIndex: SearchIndex
    storage: BackupStorage
    backendLocation: string
    backend: BackupBackend
    localBackupSettings: BrowserSettingsStore<LocalBackupSettings>
    changeTrackingQueue: Queue
    backendSelect: BackendSelect
    backupProcedure: BackupProcedure
    backupUiCommunication = new ProcedureUiCommunication('backup-event')
    remoteFunctions: BackupInterface<'provider'>
    restoreProcedure: BackupRestoreProcedure
    restoreUiCommunication: ProcedureUiCommunication = new ProcedureUiCommunication(
        'restore-event',
    )

    uiTabId?: any
    automaticBackupTimeout: number | null = null
    automaticBackupEnabled?: boolean
    scheduledAutomaticBackupTimestamp?: number
    notifications: NotificationBackground
    checkAuthorizedForAutoBackup: () => Promise<boolean>
    jobScheduler: JobScheduler

    constructor(options: {
        storageManager: Storex
        searchIndex: SearchIndex
        createQueue?: typeof Queue
        queueOpts?: QueueOpts
        notifications: NotificationBackground
        jobScheduler: JobScheduler
        localBackupSettings: BrowserSettingsStore<LocalBackupSettings>
        checkAuthorizedForAutoBackup: () => Promise<boolean>
    }) {
        options.createQueue = options.createQueue || Queue
        options.queueOpts = options.queueOpts || {
            autostart: true,
            concurrency: 1,
        }

        this.backendSelect = new BackendSelect({
            localBackupSettings: options.localBackupSettings,
        })
        this.jobScheduler = options.jobScheduler
        this.storageManager = options.storageManager
        this.storage = new BackupStorage({
            storageManager: options.storageManager,
        })
        this.searchIndex = options.searchIndex
        this.changeTrackingQueue = options.createQueue(options.queueOpts)
        this.notifications = options.notifications
        this.checkAuthorizedForAutoBackup = options.checkAuthorizedForAutoBackup
        this.localBackupSettings = options.localBackupSettings

        this.remoteFunctions = {
            enableAutomaticBackup: this.enableAutomaticBackup,
            disableAutomaticBackup: this.disableAutomaticBackup,
            isAutomaticBackupEnabled: this.isAutomaticBackupEnabled,
            isAutomaticBackupAllowed: this.isAutomaticBackupAllowed,
            disableRecordingChanges: async () => {
                this.storage.stopRecordingChanges()
                await this.disableAutomaticBackup()

                // This is needed so the recording of changes are not restarted on next ext setup
                await this.localBackupSettings.set('lastBackup', null)
            },
            getBackupTimes: async () => {
                return this.getBackupTimes()
            },
            startBackup: async ({ tab }) => {
                this.backupUiCommunication.registerUiTab(tab)
                if (this.backupProcedure.running) {
                    return
                }
                if (this.restoreProcedure && this.restoreProcedure.running) {
                    throw new Error(
                        "Come on, don't be crazy and run backup and restore at once please",
                    )
                }

                await this.doBackup()
                this.backupUiCommunication.connect(this.backupProcedure.events)
            },
        }
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(
            {
                ...this.remoteFunctions,
                getBackupProviderLoginLink: async (info, params) => {
                    const MEMEX_CLOUD_ORIGIN = _getMemexCloudOrigin()
                    return `${MEMEX_CLOUD_ORIGIN}/auth/google?scope=${DEFAULT_AUTH_SCOPE}`
                },
                initRestoreProcedure: (info, provider) => {
                    return this.initRestoreProcedure(provider)
                },
                getBackupInfo: () => {
                    return this.backupProcedure.info
                },
                pauseBackup: () => {
                    this.backupProcedure.pause()
                },
                resumeBackup: () => {
                    this.backupProcedure.resume()
                },
                cancelBackup: async () => {
                    await this.backupProcedure.cancel()
                },
                startRestore: async ({ tab }) => {
                    this.restoreUiCommunication.registerUiTab(tab)
                    await this.startRestore()
                },
                getRestoreInfo: async () => {
                    return this.restoreProcedure.info
                },
                pauseRestore: async () => {
                    await this.restoreProcedure.interruptable.pause()
                },
                resumeRestore: async () => {
                    await this.restoreProcedure.interruptable.resume()
                },
                cancelRestore: async () => {
                    await this.restoreProcedure.interruptable.cancel()
                },
                hasInitialBackup: async () => {
                    return (
                        (await this.localBackupSettings.get('lastBackup')) !=
                        null
                    )
                },
                setBackendLocation: async (info, location?: string) => {
                    if (
                        location === 'google-drive' &&
                        this.backendLocation !== location
                    ) {
                        this.backendLocation = location
                        await this.backendSelect.saveBackendLocation(location)
                        this.backend = await this.backendSelect.initGDriveBackend()
                    } else if (
                        location === 'local' &&
                        this.backendLocation !== location
                    ) {
                        this.backendLocation = location
                        await this.backendSelect.saveBackendLocation(location)
                        this.backend = await this.backendSelect.initLocalBackend()
                    }
                    // this.setupRequestInterceptor()
                    this.initBackendDependants()
                },
                getBackendLocation: async (info) => {
                    this.backendLocation = await this.backendSelect.restoreBackendLocation()
                    return this.backendLocation
                },
                isBackupBackendAuthenticated: async () => {
                    /* Check if restoreProcedure's backend is present.
                        Restore's backend is only present during restore. */
                    if (
                        this.restoreProcedure &&
                        this.restoreProcedure.backend != null
                    ) {
                        return this.restoreProcedure.backend.isAuthenticated()
                    } else if (this.backend != null) {
                        return this.backend.isAuthenticated()
                    } else {
                        return false
                    }
                },
                scheduleAutomaticBackupIfEnabled: this
                    .scheduleAutomaticBackupIfEnabled,
                sendNotification: async (id: string) => {
                    const errorId = await this.backend.sendNotificationOnFailure(
                        id,
                        this.notifications,
                        () => this.estimateInitialBackupSize(),
                    )
                    return errorId
                },
                estimateInitialBackupSize: () => {
                    return this.estimateInitialBackupSize()
                },
                setBackupBlobs: async (info, saveBlobs) => {
                    await this.localBackupSettings.set('saveBlobs', saveBlobs)
                },

                forgetAllChanges: async () => {
                    return this.forgetAllChanges()
                },
                // setupRequestInterceptor: () => {
                //     return this.setupRequestInterceptor()
                // },
            },
            { insertExtraArg: true },
        )
    }

    async handlePostStorageChange(event: StorageOperationEvent<'post'>) {
        for (const change of event.info.changes) {
            if (change.type === 'create') {
                this.storage.handleStorageChange({
                    collection: change.collection,
                    operation: 'create',
                    pk: change.pk,
                })
            } else {
                for (const pk of change.pks) {
                    this.storage.handleStorageChange({
                        collection: change.collection,
                        operation:
                            change.type === 'modify' ? 'update' : 'delete',
                        pk,
                    })
                }
            }
        }
    }

    estimateInitialBackupSize() {
        return estimateBackupSize({
            storageManager: this.storageManager,
        })
    }
    async setBackendFromStorage() {
        this.backend = await this.backendSelect.restoreBackend()
        // if (this.backend) {
        //     this.setupRequestInterceptor()
        // }
        this.initBackendDependants()
    }

    initBackendDependants() {
        this.backupProcedure = new BackupProcedure({
            localBackupSettings: this.localBackupSettings,
            storageManager: this.storageManager,
            storage: this.storage,
            backend: this.backend,
        })
    }

    async initRestoreProcedure(provider) {
        let backend: BackupBackend = null
        if (provider === 'local') {
            backend = await this.backendSelect.initLocalBackend()
        } else if (provider === 'google-drive') {
            backend = await this.backendSelect.initGDriveBackend()
            // this.setupRequestInterceptor(backend)
        }

        this.restoreProcedure = new BackupRestoreProcedure({
            storageManager: this.storageManager,
            searchIndex: this.searchIndex,
            storage: this.storage,
            backend,
        })
    }

    resetRestoreProcedure() {
        this.restoreProcedure = null
    }

    async startRecordingChangesIfNeeded() {
        if (
            !(await this.localBackupSettings.get('lastBackup')) ||
            this.storage.recordingChanges
        ) {
            return
        }

        this.storage.startRecordingChanges()
        this.scheduleAutomaticBackupIfEnabled()
    }

    isAutomaticBackupAllowed = async () => {
        return this.checkAuthorizedForAutoBackup()
    }

    isAutomaticBackupEnabled = async (): Promise<boolean> => {
        return (
            (await this.localBackupSettings.get('automaticBackupsEnabled')) ??
            false
        )
    }

    enableAutomaticBackup = async () => {
        await this.localBackupSettings.set('automaticBackupsEnabled', true)
    }

    disableAutomaticBackup = async () => {
        await this.localBackupSettings.set('automaticBackupsEnabled', false)
    }

    async scheduleAutomaticBackupIfEnabled() {
        this.scheduleAutomaticBackup()
    }

    scheduleAutomaticBackup() {
        if (
            this.automaticBackupTimeout != null ||
            (this.backupProcedure && this.backupProcedure.running)
        ) {
            return
        }

        const msUntilNextBackup = 1000 * 60 * 15
        // const msUntilNextBackup = 1000 * 30
        this.scheduledAutomaticBackupTimestamp = Date.now() + msUntilNextBackup
        this.jobScheduler.scheduleJobOnce({
            name: 'automated-legacy-data-backup',
            when: Date.now() + msUntilNextBackup,
            job: () => this.doBackup(),
        })
        this.automaticBackupTimeout = -1
    }

    clearAutomaticBackupTimeout() {
        if (this.automaticBackupTimeout != null) {
            this.jobScheduler.clearScheduledJob('automated-legacy-data-backup')
            this.automaticBackupTimeout = null
        }
    }

    async forgetAllChanges() {
        await this.storage.forgetAllChanges()
        await this.localBackupSettings.remove('lastProblemNotifShown')
    }

    async getBackupTimes() {
        const lastBackup = await this.localBackupSettings.get(
            'lastBackupFinished',
        )

        let nextBackup = null
        if (this.backupProcedure?.running) {
            nextBackup = 'running'
        } else if (await this.isAutomaticBackupEnabled()) {
            nextBackup = new Date(this.scheduledAutomaticBackupTimestamp)
        }
        if (lastBackup) {
            const times = {
                lastBackup: lastBackup ?? null,
                nextBackup:
                    lastBackup && nextBackup && nextBackup.getTime
                        ? nextBackup.getTime()
                        : null,
            }
            return times
        } else {
            const times = {
                lastBackup: null,
                nextBackup: null,
            }
            return times
        }
    }

    async maybeShowBackupProblemNotif(
        notifId: 'incremental_backup_down' | 'backup_error',
    ) {
        const lastBackup = await this.localBackupSettings.get(
            'lastBackupFinished',
        )
        if (!lastBackup) {
            return
        }
        // const backupProblemThreshold = 1000 * 60
        const backupProblemThreshold = 1000 * 60 * 60 * 24

        if (new Date(lastBackup).getTime() > 0) {
            const timeSinceLastBackup =
                Date.now() - new Date(lastBackup).getTime()
            if (timeSinceLastBackup < backupProblemThreshold) {
                return
            }
        }

        const lastNotifShown = await this.localBackupSettings.get(
            'lastProblemNotifShown',
        )
        // const problemNotifInterval = 1000 * 95
        const problemNotifInterval = 1000 * 60 * 60 * 24 * 7
        if (
            !!lastNotifShown &&
            Date.now() - lastNotifShown.getTime() < problemNotifInterval
        ) {
            return
        }

        const alreadyStoredRecently =
            !!lastNotifShown && new Date(lastNotifShown) > new Date(lastBackup)
        await this.showBackupProblemNotif(notifId, {
            storeNotif: !alreadyStoredRecently,
        })
    }

    async showBackupProblemNotif(
        notifId: 'incremental_backup_down' | 'backup_error',
        options: { storeNotif: boolean },
    ) {
        await this.notifications.dispatchNotification(notifId, {
            dontStore: !options.storeNotif,
        })
        await this.localBackupSettings.set('lastProblemNotifShown', new Date())
    }

    async doBackup() {
        const status = await checkServerStatus()
        if (!status) {
            await this.localBackupSettings.set('backupStatus', 'fail')
        }
        this.clearAutomaticBackupTimeout()
        const always = () => {
            this.scheduleAutomaticBackupIfEnabled()
        }
        this.storage.startRecordingChanges()
        if (!(await this.backend.isReachable())) {
            await this.maybeShowBackupProblemNotif('incremental_backup_down')
            return always()
        }

        try {
            this.backupProcedure.run()
        } catch (e) {
            Raven.captureException(e)
            always()
            throw e
        }
        this.backupProcedure.events.once('success', async () => {
            // sets a flag that the progress of the backup has been successful so that the UI can set a proper state
            await this.localBackupSettings.set('progressSuccessful', true)
            always()
        })
        this.backupProcedure.events.once('fail', async () => {
            await this.maybeShowBackupProblemNotif('backup_error')
            always()
        })
    }

    async prepareRestore() {
        this.clearAutomaticBackupTimeout()
        // await this.lastBackupStorage.storeLastBackupTime(null)

        const runner = this.restoreProcedure.runner()
        this.restoreProcedure.events.once('success', async () => {
            // await this.lastBackupStorage.storeLastBackupTime(new Date())
            await this.startRecordingChangesIfNeeded()
            await this.scheduleAutomaticBackupIfEnabled()
            this.resetRestoreProcedure()
        })

        return runner
    }

    async startRestore({ debug = false } = {}) {
        if (this.restoreProcedure.running) {
            return
        }
        if (this.backupProcedure.running) {
            throw new Error(
                "Come on, don't be crazy and run backup and restore at once please",
            )
        }
        const runner = await this.prepareRestore()
        if (!debug) {
            this.restoreUiCommunication.connect(this.restoreProcedure.events)
        } else {
            this.restoreUiCommunication.connect(
                this.restoreProcedure.events,
                (name, event) => {},
            )
        }
        runner()
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
