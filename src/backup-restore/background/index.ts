// tslint:disable:no-console
import Storex from '@worldbrain/storex'
import Queue, { Options as QueueOpts } from 'queue'

import { makeRemotelyCallable } from '../../util/webextensionRPC'
import { setLocalStorage } from 'src/util/storage'
import { setupRequestInterceptors } from './redirect'
import BackupStorage, { BackupInfoStorage } from './storage'
import { BackupBackend } from './backend'
import { BackendSelect } from './backend-select'
import estimateBackupSize from './estimate-backup-size'
import BackupProcedure from './procedures/backup'
import { BackupRestoreProcedure } from './procedures/restore'
import { ProcedureUiCommunication } from 'src/backup-restore/background/procedures/ui-communication'
import NotificationBackground from 'src/notifications/background'
import { DEFAULT_AUTH_SCOPE } from './backend/google-drive'
import { SearchIndex } from 'src/search'
import * as Raven from 'src/util/raven'

export * from './backend'

export class BackupBackgroundModule {
    storageManager: Storex
    searchIndex: SearchIndex
    storage: BackupStorage
    backendLocation: string
    backend: BackupBackend
    backupInfoStorage: BackupInfoStorage
    changeTrackingQueue: Queue
    backendSelect = new BackendSelect()
    backupProcedure: BackupProcedure
    backupUiCommunication = new ProcedureUiCommunication('backup-event')
    restoreProcedure: BackupRestoreProcedure
    restoreUiCommunication: ProcedureUiCommunication = new ProcedureUiCommunication(
        'restore-event',
    )

    uiTabId?: any
    automaticBackupTimeout?: any
    automaticBackupEnabled?: boolean
    scheduledAutomaticBackupTimestamp?: number
    notifications: NotificationBackground
    checkAuthorizedForAutoBackup: () => Promise<boolean>

    constructor(options: {
        storageManager: Storex
        searchIndex: SearchIndex
        backupInfoStorage: BackupInfoStorage
        createQueue?: typeof Queue
        queueOpts?: QueueOpts
        notifications: NotificationBackground
        checkAuthorizedForAutoBackup: () => Promise<boolean>
    }) {
        options.createQueue = options.createQueue || Queue
        options.queueOpts = options.queueOpts || {
            autostart: true,
            concurrency: 1,
        }

        this.storageManager = options.storageManager
        this.storage = new BackupStorage({
            storageManager: options.storageManager,
        })
        this.searchIndex = options.searchIndex
        this.backupInfoStorage = options.backupInfoStorage
        this.changeTrackingQueue = options.createQueue(options.queueOpts)
        this.notifications = options.notifications
        this.checkAuthorizedForAutoBackup = options.checkAuthorizedForAutoBackup
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(
            {
                getBackupProviderLoginLink: async (info, params) => {
                    const MEMEX_CLOUD_ORIGIN = _getMemexCloudOrigin()
                    return `${MEMEX_CLOUD_ORIGIN}/auth/google?scope=${DEFAULT_AUTH_SCOPE}`
                },
                startBackup: async ({ tab }, params) => {
                    this.backupUiCommunication.registerUiTab(tab)
                    if (this.backupProcedure.running) {
                        return
                    }
                    if (
                        this.restoreProcedure &&
                        this.restoreProcedure.running
                    ) {
                        throw new Error(
                            "Come on, don't be crazy and run backup and restore at once please",
                        )
                    }

                    await this.doBackup()
                    this.backupUiCommunication.connect(
                        this.backupProcedure.events,
                    )
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
                    return !!(await this.backupInfoStorage.retrieveDate(
                        'lastBackup',
                    ))
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
                    this.setupRequestInterceptor()
                    this.initBackendDependants()
                },
                getBackendLocation: async info => {
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
                isAutomaticBackupEnabled: this.isAutomaticBackupEnabled,
                isAutomaticBackupAllowed: this.isAutomaticBackupAllowed,
                scheduleAutomaticBackupIfEnabled: this
                    .scheduleAutomaticBackupIfEnabled,
                enableAutomaticBackup: this.enableAutomaticBackup,
                disableAutomaticBackup: this.disableAutomaticBackup,
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
                setBackupBlobs: (info, saveBlobs) => {
                    localStorage.setItem('backup.save-blobs', saveBlobs)
                },
                getBackupTimes: async () => {
                    return this.getBackupTimes()
                },
                forgetAllChanges: async () => {
                    return this.forgetAllChanges()
                },
                setupRequestInterceptor: () => {
                    return this.setupRequestInterceptor()
                },
            },
            { insertExtraArg: true },
        )
    }

    estimateInitialBackupSize() {
        return estimateBackupSize({
            storageManager: this.storageManager,
        })
    }
    async setBackendFromStorage() {
        this.backend = await this.backendSelect.restoreBackend()
        if (this.backend) {
            this.setupRequestInterceptor()
        }
        this.initBackendDependants()
    }

    initBackendDependants() {
        this.backupProcedure = new BackupProcedure({
            storageManager: this.storageManager,
            storage: this.storage,
            lastBackupStorage: this.backupInfoStorage,
            backend: this.backend,
        })
    }

    async initRestoreProcedure(provider) {
        let backend: BackupBackend = null
        if (provider === 'local') {
            backend = await this.backendSelect.initLocalBackend()
        } else if (provider === 'google-drive') {
            backend = await this.backendSelect.initGDriveBackend()
            this.setupRequestInterceptor(backend)
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

    setupRequestInterceptor(backupBackend: BackupBackend = null) {
        const backend = backupBackend || this.backend
        setupRequestInterceptors({
            webRequest: window['browser'].webRequest,
            handleLoginRedirectedBack: backend
                ? backend.handleLoginRedirectedBack.bind(backend)
                : null,
            // isAutomaticBackupEnabled: () => this.isAutomaticBackupEnabled(),
            memexCloudOrigin: _getMemexCloudOrigin(),
        })
    }

    async startRecordingChangesIfNeeded() {
        if (
            !(await this.backupInfoStorage.retrieveDate('lastBackup')) ||
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

    isAutomaticBackupEnabled() {
        return (
            localStorage.getItem('backup.automatic-backups-enabled') === 'true'
        )
    }

    enableAutomaticBackup() {
        localStorage.setItem('backup.automatic-backups-enabled', 'true')
    }

    disableAutomaticBackup() {
        localStorage.setItem('backup.automatic-backups-enabled', 'false')
    }

    async scheduleAutomaticBackupIfEnabled() {
        if (await this.isAutomaticBackupEnabled()) {
            this.scheduleAutomaticBackup()
        }
    }

    scheduleAutomaticBackup() {
        if (
            this.automaticBackupTimeout ||
            (this.backupProcedure && this.backupProcedure.running)
        ) {
            return
        }

        const msUntilNextBackup = 1000 * 60 * 15
        // const msUntilNextBackup = 1000 * 30
        this.scheduledAutomaticBackupTimestamp = Date.now() + msUntilNextBackup
        this.automaticBackupTimeout = setTimeout(() => {
            this.doBackup()
        }, msUntilNextBackup)
    }

    clearAutomaticBackupTimeout() {
        if (this.automaticBackupTimeout) {
            clearTimeout(this.automaticBackupTimeout)
            this.automaticBackupTimeout = null
        }
    }

    async forgetAllChanges() {
        await this.storage.forgetAllChanges()
        await this.backupInfoStorage.clear()
    }

    async getBackupTimes() {
        const lastBackup = await this.backupInfoStorage.retrieveDate(
            'lastBackupFinish',
        )
        let nextBackup = null
        if (this.backupProcedure.running) {
            nextBackup = 'running'
        } else if (await this.isAutomaticBackupEnabled()) {
            nextBackup = new Date(this.scheduledAutomaticBackupTimestamp)
        }
        const times = {
            lastBackup: lastBackup && lastBackup.getTime(),
            nextBackup:
                nextBackup && nextBackup.getTime
                    ? nextBackup.getTime()
                    : nextBackup,
        }
        return times
    }

    async maybeShowBackupProblemNotif(
        notifId: 'incremental_backup_down' | 'backup_error',
    ) {
        const lastBackup = await this.backupInfoStorage.retrieveDate(
            'lastBackupFinish',
        )
        // const backupProblemThreshold = 1000 * 60
        const backupProblemThreshold = 1000 * 60 * 60 * 24
        const timeSinceLastBackup = Date.now() - lastBackup.getTime()
        if (timeSinceLastBackup < backupProblemThreshold) {
            return
        }

        const lastNotifShown = await this.backupInfoStorage.retrieveDate(
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
            !!lastNotifShown && lastNotifShown > lastBackup
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
        await this.backupInfoStorage.storeDate(
            'lastProblemNotifShown',
            new Date(),
        )
    }

    async doBackup() {
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
            localStorage.setItem('progress-successful', 'true')

            this.backupInfoStorage.storeDate('lastBackupFinish', new Date())
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
