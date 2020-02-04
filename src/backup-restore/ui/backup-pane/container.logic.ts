import React from 'react'
const mapValues = require('lodash/mapValues')
import { redirectToGDriveLogin } from 'src/backup-restore/ui/utils'
import { Analytics } from 'src/analytics/types'
import { OPTIONS_URL } from 'src/constants'

export async function getInitialState({
    analytics,
    localStorage,
    remoteFunction,
}: {
    analytics: Analytics
    localStorage: any
    remoteFunction: any
}) {
    const isAuthenticated = await remoteFunction(
        'isBackupBackendAuthenticated',
    )()

    const runningRestore = await localStorage.getItem(
        'backup.restore.restore-running',
    )
    const runningBackup = await localStorage.getItem(
        'backup.onboarding.running-backup',
    )
    const progressSuccess = await localStorage.getItem('progress-successful')
    const backendLocation = await remoteFunction('getBackendLocation')()
    const hasInitialBackup = await remoteFunction('hasInitialBackup')()
    const driveAuthenticated = await localStorage.getItem('drive-token-access')
    const isOnboarding = await localStorage.getItem('backup.onboarding')
    const driveIsAuthenticating = await localStorage.getItem(
        'backup.onboarding.authenticating',
    )

    return {
        isAuthenticated,
        runningRestore,
        runningBackup,
        screen: await getStartScreen({
            isAuthenticated,
            localStorage,
            analytics,
            remoteFunction,
            runningRestore,
            runningBackup,
            progressSuccess,
            backendLocation,
            hasInitialBackup,
            driveAuthenticated,
            isOnboarding,
            driveIsAuthenticating,
        }),
    }
}

export async function getStartScreen({
    localStorage,
    analytics,
    remoteFunction,
    isAuthenticated,
    runningRestore,
    runningBackup,
    progressSuccess,
    backendLocation,
    hasInitialBackup,
    driveAuthenticated,
    isOnboarding,
    driveIsAuthenticating,
}: {
    analytics: Analytics
    localStorage: any
    remoteFunction: any
    isAuthenticated: boolean
    runningRestore: string
    runningBackup: string
    progressSuccess: string
    backendLocation: string
    hasInitialBackup: boolean
    driveAuthenticated: string
    isOnboarding: string
    driveIsAuthenticating: string
}) {
    const hasScreenOverride =
        process.env.BACKUP_START_SCREEN &&
        process.env.BACKUP_START_SCREEN.length

    // This is for now pretty hacky. What happens is that on
    // a successful progress (backup/restore/import/sync) it saves a
    // localstorage data point "progress-successful". Its picked up here
    // and cleared so that on a successful restore/backup the backupoverview is shown again
    // using explicit "runningbackup/runningrestore" states because that decides which progress
    // bar is loaded after reloading
    if (runningBackup === 'true') {
        // using a progressSuccess message because that would allow to separately decide on if
        // any process is finished, so we don't have to implement this for every kind of process.
        if (progressSuccess === 'true') {
            await localStorage.removeItem('backup.onboarding')
            await localStorage.removeItem('progress-successful')
            await localStorage.removeItem('backup.onboarding.running-backup')
            return 'overview'
        } else {
            return 'running-backup'
        }
    }

    if (runningRestore === 'true') {
        if (progressSuccess === 'true') {
            await localStorage.removeItem('progress-successful')
            await localStorage.removeItem('backup.restore.restore-running')
            return 'overview'
        } else {
            return 'restore-running'
        }
    }
    // ensures that on a blocked connection, the page on reload shows the progress screen
    if (
        backendLocation === 'google-drive' &&
        driveAuthenticated &&
        !hasInitialBackup &&
        isOnboarding &&
        driveIsAuthenticating
    ) {
        return 'onboarding-size'
    } else {
        await localStorage.removeItem('backup.onboarding.authenticating')
        await localStorage.removeItem('backup.onboarding')
        await localStorage.removeItem('progress-successful')
        return 'overview'
    }
}

export async function processEvent({
    state,
    event,
    localStorage,
    analytics,
    remoteFunction,
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

    const triggerOnboarding = () => {
        localStorage.setItem('backup.onboarding', true)
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

                const driveAuthenticated = await localStorage.getItem(
                    'drive-token-access',
                )

                if (hasInitialBackup) {
                    localStorage.setItem(
                        'backup.onboarding.running-backup',
                        true,
                    )
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
            onRestoreRequested: () => {
                if (
                    localStorage.getItem('backup.restore.restore-running') ===
                    true
                ) {
                    return { screen: 'restore-running' }
                }
                return { screen: 'restore-where' }
            },
            onSubscribeRequested: () => {
                const { choice } = event

                localStorage.setItem('backup.onboarding.authenticating', true)
                return {
                    redirect: { to: 'automatic-backup-purchase', choice },
                }
            },
            onBlobPreferenceChange: _onBlobPreferenceChange,
        },
        'onboarding-where': {
            onChoice: async () => {
                // initializing the backend of the users choice
                const location = event.choice
                remoteFunction('setBackendLocation')(location)
                analytics.trackEvent({
                    category: 'Backup',
                    action: 'onboarding-where-chosen',
                })

                const isAutomaticBackupEnabled = await remoteFunction(
                    'isAutomaticBackupEnabled',
                )()
                if (isAutomaticBackupEnabled) {
                    return { screen: 'onboarding-size' }
                } else {
                    return { screen: 'onboarding-how' }
                }
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
                return { screen: 'running-backup' }
            },
        },
        'onboarding-how': {
            onChoice: async () => {
                const { choice } = event

                await analytics.trackEvent({
                    category: 'Backup',
                    action: 'onboarding-how-chosen',
                    value: { type: choice.type },
                })

                if (choice.type === 'automatic') {
                    // TODO: (ch): Hack, setting the key here, don't know why the following remoteFunction does not work
                    localStorage.setItem(
                        'backup.automatic-backups-enabled',
                        'true',
                    )
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
            onLoginRequested: () => {
                analytics.trackEvent({
                    category: 'Backup',
                    action: 'onboarding-login-requested',
                })
                localStorage.setItem('backup.onboarding.authenticating', true)
                return { redirect: { to: 'gdrive-login' } }
            },
            onBackupRequested: () => {
                analytics.trackEvent({
                    category: 'Backup',
                    action: 'onboarding-backup-requested',
                })
                localStorage.setItem('backup.onboarding.running-backup', true)
                return { screen: 'running-backup' }
            },
        },
        'running-backup': {
            onFinish: async () => {
                await localStorage.removeItem('backup.onboarding')
                await localStorage.removeItem(
                    'backup.onboarding.authenticating',
                )
                await localStorage.removeItem(
                    'backup.onboarding.running-backup',
                )
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
                    localStorage.setItem('backup.restore.authenticating', true)
                    return { redirect: { to: 'gdrive-login' } }
                } else {
                    localStorage.setItem('backup.restore.restore-running', true)
                    return { screen: 'restore-running' }
                }
            },
        },
        'restore-running': {
            onFinish: () => {
                localStorage.removeItem('backup.restore.restore-running')
                return { screen: 'overview' }
            },
        },
    }

    const handler = handlers[state.screen][event.type]
    const { screen, redirect } = await handler()
    return { screen, redirect }
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
        localStorage: any
        analytics: any
        remoteFunction: (name: string) => (...args) => Promise<any>
    }
    onStateChange: (changes: any) => void
    onRedirect: (redirect: any) => void
}) =>
    mapValues(screenConfig.events, (eventConfig, eventName) => {
        return async event => {
            const handlerEvent = { type: eventName }
            if (eventConfig.argument) {
                handlerEvent[eventConfig.argument] = event
            }
            const result = await eventProcessor({
                state,
                event: handlerEvent,
                ...dependencies,
            })
            if (result.screen) {
                onStateChange({ screen: result.screen })
            } else if (result.redirect) {
                onRedirect(result.redirect)
            }
        }
    })

export function doRedirect(redirect) {
    const redirects = {
        'gdrive-login': () => redirectToGDriveLogin(),
        'automatic-backup-purchase': () => {
            // TODO: (ch) should probably pop up a dialog, and use a redirect function, but for now we'll just navigate
            window.location.href = `${OPTIONS_URL}#/subscribe`
        },
    }
    return redirects[redirect.to]()
}
