// tslint:disable:no-console
import Storex from '@worldbrain/storex'
import Queue, { Options as QueueOpts } from 'queue'

import { makeRemotelyCallable } from '../../util/webextensionRPC'
import { setLocalStorage } from 'src/util/storage'
import { setupRequestInterceptors } from './redirect'
import BackupStorage, { LastBackupStorage } from './storage'
import { BackupBackend } from './backend'
import { BackendSelect } from './backend-select'
import estimateBackupSize from './estimate-backup-size'
import BackupProcedure from './procedures/backup'
import { BackupRestoreProcedure } from './procedures/restore'
import { ProcedureUiCommunication } from 'src/backup/background/procedures/ui-communication'
import NotificationBackground from 'src/notifications/background'
import { DEFAULT_AUTH_SCOPE } from './backend/google-drive'
import { SearchIndex } from 'src/search'

export * from './backend'

export class BackupBackgroundModule {
    storageManager: Storex
    searchIndex: SearchIndex
    storage: BackupStorage
    backendLocation: string
    backend: BackupBackend
    lastBackupStorage: LastBackupStorage
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

    constructor({
        storageManager,
        searchIndex,
        lastBackupStorage,
        createQueue = Queue,
        queueOpts = { autostart: true, concurrency: 1 },
        notifications,
    }: {
        storageManager: Storex
        searchIndex: SearchIndex
        lastBackupStorage: LastBackupStorage
        createQueue?: typeof Queue
        queueOpts?: QueueOpts
        notifications: NotificationBackground
    }) {
        this.storageManager = storageManager
        this.storage = new BackupStorage({ storageManager })
        this.lastBackupStorage = lastBackupStorage
        this.changeTrackingQueue = createQueue(queueOpts)
        this.notifications = notifications
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(
            {
                getBackupProviderLoginLink: async (info, params) => {
                    const MEMEX_CLOUD_ORIGIN = _getMemexCloudOrigin()
                    return `${MEMEX_CLOUD_ORIGIN}/auth/google?scope=${DEFAULT_AUTH_SCOPE}`
                },
                startBackup: ({ tab }, params) => {
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

                    this.doBackup()
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
                    return !!(await this.lastBackupStorage.getLastBackupTime())
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
                maybeCheckAutomaticBackupEnabled: async () => {
                    // TODO: (ch) What is this used for?

                    // TODO: (ch) Auth-Memex-Backup
                    const hasFeatureAutoBackup = true

                    // TODO: (ch) document logic here
                    const lastBackupTime = !!(await this.lastBackupStorage.getLastBackupTime())
                    const nextBackup = localStorage.getItem('nextBackup')
                    if (
                        hasFeatureAutoBackup &&
                        lastBackupTime &&
                        nextBackup === null
                    ) {
                        await this.checkAutomaticBackupEnabled()
                        await this.scheduleAutomaticBackupIfEnabled()
                    }
                },
                checkAutomaticBackupEnabled: async () => {
                    // TODO: (ch) What is this used for?
                },
                isAutomaticBackupEnabled: this.isAutomaticBackupEnabled,
                isAutomaticBackupAllowed: this.isAutomaticBackupAllowed,
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
            lastBackupStorage: this.lastBackupStorage,
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
            checkAutomaticBackupEnabled: () =>
                this.checkAutomaticBackupEnabled(),
            memexCloudOrigin: _getMemexCloudOrigin(),
        })
    }

    async startRecordingChangesIfNeeded() {
        if (
            !(await this.lastBackupStorage.getLastBackupTime()) ||
            this.storage.recordingChanges
        ) {
            return
        }

        this.storage.startRecordingChanges()
        this.scheduleAutomaticBackupIfEnabled()
    }

    isAutomaticBackupEnabled({ forceCheck = false } = {}) {
        // const check = this.checkAutomaticBackupEnabled()
        const check = false
        if (!forceCheck && check) {
            return check
        }

        const override = process.env.AUTOMATIC_BACKUP
        if (override) {
            console.log('Automatic backup override:', override)
            return override === 'true'
        }

        if (!localStorage.getItem('wp.user-id')) {
            return false
        }

        return this.checkAutomaticBackupEnabled()
    }

    async isAutomaticBackupAllowed() {
        // return auth.isAuthorizedForFeature(UserFeatures.BACKUP)
        return true
    }

    async checkAutomaticBackupEnabled() {
        // todo: check the feature setting?
        return true
    }

    async scheduleAutomaticBackupIfEnabled() {
        if (await this.isAutomaticBackupEnabled()) {
            this.scheduleAutomaticBackup()
        }
    }

    scheduleAutomaticBackup() {
        if (this.automaticBackupTimeout || this.backupProcedure.running) {
            return
        }

        const msUntilNextBackup = 1000 * 60 * 15
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
        await this.lastBackupStorage.removeBackupTimes()
    }

    async getBackupTimes() {
        const lastBackup = await this.lastBackupStorage.getLastBackupFinishTime()
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

    doBackup() {
        this.clearAutomaticBackupTimeout()

        this.storage.startRecordingChanges()
        this.backupProcedure.run()

        const always = () => {
            this.scheduleAutomaticBackupIfEnabled()
        }
        this.backupProcedure.events.on('success', async () => {
            this.lastBackupStorage.storeLastBackupFinishTime(new Date())
            always()
        })
        this.backupProcedure.events.on('fail', () => {
            always()
        })

        return this.backupProcedure.events
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
                (name, event) => {
                    console.log(`RESTORE DEBUG (${name}):`, event)
                },
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
