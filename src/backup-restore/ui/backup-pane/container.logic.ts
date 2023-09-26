import React from 'react'
const mapValues = require('lodash/mapValues')
import { redirectToGDriveLogin } from 'src/backup-restore/ui/utils'
import type { Analytics } from 'src/analytics/types'
import type { BrowserSettingsStore } from 'src/util/settings'
import type { LocalBackupSettings } from 'src/backup-restore/background/types'

export async function getInitialState({
    analytics,
    localBackupSettings,
    remoteFunction,
}: {
    analytics: Analytics
    localBackupSettings: BrowserSettingsStore<LocalBackupSettings>
    remoteFunction: any
}) {
    const isAuthenticated = await remoteFunction(
        'isBackupBackendAuthenticated',
    )()

    const runningRestore = await localBackupSettings.get('runningRestore')
    const runningBackup = await localBackupSettings.get('runningBackup')
    const progressSuccess = !!(await localBackupSettings.get(
        'progressSuccessful',
    ))
    const backendLocation = await remoteFunction('getBackendLocation')()
    const hasInitialBackup = !!(await remoteFunction('hasInitialBackup')())
    const driveAuthenticated = !!(await localBackupSettings.get('accessToken'))
    const isOnboarding = !!(await localBackupSettings.get('isOnboarding'))
    const backupIsAuthenticating = !!(await localBackupSettings.get(
        'backupIsAuthenticating',
    ))
    const restoreIsAuthenticating = !!(await localBackupSettings.get(
        'restoreIsAuthenticating',
    ))

    return {
        isAuthenticated,
        runningRestore,
        runningBackup,
        isDumpModalShown: false,
        screen: await getStartScreen(
            {
                isAuthenticated,
                runningRestore,
                runningBackup,
                progressSuccess,
                backendLocation,
                hasInitialBackup,
                driveAuthenticated,
                isOnboarding,
                backupIsAuthenticating,
                restoreIsAuthenticating,
            },
            {
                remoteFunction,
                localBackupSettings: localBackupSettings,
                analytics,
            },
        ),
    }
}

export async function getStartScreen(
    state: {
        isAuthenticated: boolean
        runningRestore: boolean
        runningBackup: boolean
        progressSuccess: boolean
        backendLocation: string
        hasInitialBackup: boolean
        driveAuthenticated: boolean
        isOnboarding: boolean
        backupIsAuthenticating: boolean
        restoreIsAuthenticating: boolean
    },
    dependencies: {
        remoteFunction: any
        analytics: Analytics
        localBackupSettings: BrowserSettingsStore<LocalBackupSettings>
    },
) {
    // This is for now pretty hacky. What happens is that on
    // a successful progress (backup/restore/import/sync) it saves a
    // localstorage data point "backup.success". Its picked up here
    // and cleared so that on a successful restore/backup the backupoverview is shown again
    // using explicit "runningbackup/runningrestore" states because that decides which progress
    // bar is loaded after reloading
    if (state.runningBackup) {
        // using a progressSuccess message because that would allow to separately decide on if
        // any process is finished, so we don't have to implement this for every kind of process.
        if (state.progressSuccess) {
            await dependencies.localBackupSettings.remove('isOnboarding')
            await dependencies.localBackupSettings.remove('progressSuccessful')
            await dependencies.localBackupSettings.remove('runningBackup')
            return 'overview'
        } else {
            return 'running-backup'
        }
    }

    if (state.runningRestore) {
        if (state.progressSuccess) {
            await dependencies.localBackupSettings.remove('progressSuccessful')
            await dependencies.localBackupSettings.remove('runningRestore')
            return 'overview'
        } else {
            return 'restore-running'
        }
    }

    await dependencies.localBackupSettings.remove('isOnboarding')

    const driveIsAuthenticating =
        state.backupIsAuthenticating || state.restoreIsAuthenticating
    if (driveIsAuthenticating) {
        if (state.backupIsAuthenticating) {
            await dependencies.localBackupSettings.remove(
                'backupIsAuthenticating',
            )
            if (state.driveAuthenticated) {
                return 'running-backup'
            } else {
                return 'onboarding-size'
            }
        } else {
            await dependencies.localBackupSettings.remove(
                'restoreIsAuthenticating',
            )
            if (state.driveAuthenticated) {
                return 'restore-running'
            } else {
                return 'restore-where'
            }
        }
    }

    if (
        state.backendLocation === 'google-drive' &&
        state.driveAuthenticated &&
        !state.hasInitialBackup &&
        state.isOnboarding &&
        driveIsAuthenticating
    ) {
        return 'onboarding-size'
    } else {
        await dependencies.localBackupSettings.remove('progressSuccessful')
        return 'overview'
    }
}

export async function processEvent({
    state,
    event,
    analytics,
    remoteFunction,
    localBackupSettings,
}: {
    state
    event
    analytics
    remoteFunction
    localBackupSettings: BrowserSettingsStore<LocalBackupSettings>
}) {
    const _onBlobPreferenceChange = () => {
        analytics.trackEvent({
            category: 'Backup',
            action: 'onboarding-blob-pref-change',
            value: event.saveBlobs,
        })
        remoteFunction('setBackupBlobs')(event.saveBlobs)
        return {}
    }

    const triggerOnboarding = async () => {
        await localBackupSettings.set('isOnboarding', true)
        analytics.trackEvent({
            category: 'Backup',
            action: 'onboarding-triggered',
        })
        return { screen: 'onboarding-where' }
    }

    const handlers = {
        overview: {
            onBackupSetupRequested: async () => {
                return triggerOnboarding()
            },
            onBackupRequested: async () => {
                const changeBackupRequested = event.changeBackupRequested
                const [
                    hasInitialBackup,
                    backupInfo,
                    backendLocation,
                ] = await Promise.all([
                    remoteFunction('hasInitialBackup')(),
                    remoteFunction('getBackupInfo')(),
                    remoteFunction('getBackendLocation')(),
                ])
                /* Show onboarding screen if there is no initial backup or if the
                    user is trying to change the backend location */
                const needsOnBoarding = !hasInitialBackup && !backupInfo
                if (needsOnBoarding || changeBackupRequested === true) {
                    return triggerOnboarding()
                }

                const driveAuthenticated = await localBackupSettings.get(
                    'accessToken',
                )

                if (hasInitialBackup) {
                    await localBackupSettings.set('runningBackup', true)
                    return { screen: 'running-backup' }
                }

                /* Navigate to Google Drive login if previous it is not authentication
                    else go to running backup */
                if (
                    backendLocation === 'google-drive' &&
                    driveAuthenticated === undefined
                ) {
                    return { redirect: { to: 'gdrive-login' } }
                } else {
                    return { screen: 'onboarding-where' }
                }
            },
            onRestoreRequested: async () => {
                if (
                    (await localBackupSettings.get('runningRestore')) === true
                ) {
                    return { screen: 'restore-running' }
                }
                return { screen: 'restore-where' }
            },
            onBlobPreferenceChange: _onBlobPreferenceChange,
            onDumpRequested: () => ({ isDumpModalShown: true }),
        },
        'onboarding-where': {
            onChoice: async () => {
                // initializing the backend of the users choice
                const location = event.choice
                remoteFunction('setBackendLocation')('local')
                analytics.trackEvent({
                    category: 'Backup',
                    action: 'onboarding-where-chosen',
                })
                await localBackupSettings.set('automaticBackupsEnabled', true)
                await remoteFunction('enableAutomaticBackup')
                await localBackupSettings.set('runningBackup', true)
                await remoteFunction('startBackup')
                return { screen: 'running-backup' }
            },
            onChangeLocalLocation: () => {
                if (
                    this.backendLocation === 'google-drive' &&
                    !state.isAuthenticated
                ) {
                    return { redirect: { to: 'gdrive-login' } }
                } else {
                    return { screen: 'onboarding-size' }
                }
            },
        },
        'onboarding-how': {
            onChoice: async () => {
                const { choice } = event
                remoteFunction('setBackendLocation')('local')

                await analytics.trackEvent({
                    category: 'Backup',
                    action: 'onboarding-how-chosen',
                    value: { type: choice.type },
                })

                if (choice.type === 'automatic') {
                    // TODO: (ch): Hack, setting the key here, don't know why the following remoteFunction does not work
                    await localBackupSettings.set(
                        'automaticBackupsEnabled',
                        true,
                    )
                    await remoteFunction('startBackup')
                    await remoteFunction('enableAutomaticBackup')
                }
                return { screen: 'onboarding-size' }
            },
            onBackRequested: () => {
                return { screen: 'onboarding-where' }
            },
        },
        'onboarding-size': {
            onBlobPreferenceChange: _onBlobPreferenceChange,
            onLoginRequested: async () => {
                analytics.trackEvent({
                    category: 'Backup',
                    action: 'onboarding-login-requested',
                })
                await localBackupSettings.set('backupIsAuthenticating', true)
                return { redirect: { to: 'gdrive-login' } }
            },
            onBackupRequested: async () => {
                analytics.trackEvent({
                    category: 'Backup',
                    action: 'onboarding-backup-requested',
                })
                await localBackupSettings.set('runningBackup', true)
                return { screen: 'running-backup' }
            },
        },
        'running-backup': {
            onFinish: async () => {
                await localBackupSettings.remove('isOnboarding')
                await localBackupSettings.remove('runningBackup')
                return { screen: 'overview' }
            },
        },
        'restore-where': {
            onChoice: async () => {
                analytics.trackEvent({
                    category: 'Backup',
                    action: 'restore-where-chosen',
                })
                const location = event.choice
                await remoteFunction('initRestoreProcedure')(location)

                if (location === 'google-drive' && !state.isAuthenticated) {
                    await localBackupSettings.set(
                        'restoreIsAuthenticating',
                        true,
                    )
                    return { redirect: { to: 'gdrive-login' } }
                } else {
                    await localBackupSettings.set('runningRestore', true)
                    return { screen: 'restore-running' }
                }
            },
        },
        'restore-running': {
            onFinish: async () => {
                await localBackupSettings.remove('runningRestore')
                return { screen: 'overview' }
            },
        },
    }

    const handler = handlers[state.screen][event.type]
    return handler()
}

export interface ScreenConfig {
    component: React.Component
    state: { [key: string]: true }
    events: { [name: string]: true | { argument: string } }
}
export const getScreenProps = ({
    state,
    screenConfig,
}: {
    state: any
    screenConfig: ScreenConfig
}) => mapValues(screenConfig.state || {}, (value, key) => state[key])

export const getScreenHandlers = ({
    state,
    screenConfig,
    eventProcessor,
    dependencies,
    onStateChange,
    onRedirect,
}: {
    state: any
    screenConfig: ScreenConfig
    eventProcessor: typeof processEvent
    dependencies: {
        localBackupSettings: BrowserSettingsStore<LocalBackupSettings>
        analytics: any
        remoteFunction: (name: string) => (...args) => Promise<any>
    }
    onStateChange: (changes: any) => void
    onRedirect: (redirect: any) => void
}) =>
    mapValues(screenConfig.events, (eventConfig, eventName) => {
        return async (event) => {
            const handlerEvent = { type: eventName }
            if (eventConfig.argument) {
                handlerEvent[eventConfig.argument] = event
            }
            const result = await eventProcessor({
                state,
                event: handlerEvent,
                ...dependencies,
            })
            if (result.redirect) {
                onRedirect(result.redirect)
            } else {
                onStateChange(result)
            }
        }
    })

export function doRedirect(redirect) {
    const redirects = {
        'gdrive-login': () => redirectToGDriveLogin(),
    }
    return redirects[redirect.to]()
}
