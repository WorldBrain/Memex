import { makeRemotelyCallable } from '../../util/webextensionRPC'
import { StorageManager } from '../../search/types'
import { setupRequestInterceptors } from './redirect'
import BackupStorage, { LastBackupStorage } from './storage'
import { BackupBackend } from './backend'
import estimateBackupSize from './estimate-backup-size'
import BackupProcedure from './procedures/backup'
import { isExcludedFromBackup } from './utils'

export * from './backend'

export class BackupBackgroundModule {
    storageManager: StorageManager
    storage: BackupStorage
    backend: BackupBackend
    lastBackupStorage: LastBackupStorage
    backupProcedure: BackupProcedure

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

        this.backupProcedure = new BackupProcedure({
            storageManager,
            storage: this.storage,
            lastBackupStorage,
            backend,
        })
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
                    if (this.backupProcedure.running) {
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
                    this.backupProcedure.events.on('info', event =>
                        sendEvent('info', event),
                    )
                    this.backupProcedure.events.on('fail', event =>
                        sendEvent('fail', event),
                    )
                    this.backupProcedure.events.on('success', event =>
                        sendEvent('success', event),
                    )
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
                    return this.backupProcedure.info
                },
                estimateInitialBackupSize: () => {
                    return estimateBackupSize({
                        storageManager: this.storageManager,
                    })
                },
                setBackupBlobs: (info, saveBlobs) => {
                    localStorage.setItem('backup.save-blobs', saveBlobs)
                },
                getBackupTimes: async () => {
                    return this.getBackupTimes()
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
            this.storage.recordingChanges
        ) {
            return
        }

        this.storage.startRecordingChanges()
        this.maybeScheduleAutomaticBackup()
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
        if (this.automaticBackupTimeout || this.backupProcedure.running) {
            return
        }

        const msUntilNextBackup = 1000 * 60 * 15
        this.scheduledAutomaticBackupTimestamp = Date.now() + msUntilNextBackup
        this.automaticBackupTimeout = setTimeout(() => {
            this.doBackup()
        }, msUntilNextBackup)
    }

    async getBackupTimes() {
        const lastBackup = await this.lastBackupStorage.getLastBackupTime()
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
        if (this.automaticBackupTimeout) {
            clearTimeout(this.automaticBackupTimeout)
            this.automaticBackupTimeout = null
        }

        this.storage.startRecordingChanges()
        this.backupProcedure.run()

        const always = () => {
            this.maybeScheduleAutomaticBackup()
        }
        this.backupProcedure.events.on('success', () => {
            always()
        })
        this.backupProcedure.events.on('fail', () => {
            always()
        })

        return this.backupProcedure.events
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
