import React from 'react'
const mapValues = require('lodash/mapValues')
import {
    redirectToGDriveLogin,
    redirectToAutomaticBackupPurchase,
} from 'src/options/backup/utils'
import { Analytics } from 'src/analytics/types'

export async function getInitialState({
    analytics,
    localStorage,
    remoteFunction,
}: {
    analytics: Analytics
    localStorage: any
    remoteFunction: any
}) {
    const isAuthenticated = await remoteFunction('isBackupAuthenticated')()
    return {
        isAuthenticated,
        screen: await getStartScreen({
            isAuthenticated,
            localStorage,
            analytics,
            remoteFunction,
        }),
    }
}

export async function getStartScreen({
    localStorage,
    analytics,
    remoteFunction,
    isAuthenticated,
}: {
    analytics: Analytics
    localStorage: any
    remoteFunction: any
    isAuthenticated: boolean
}) {
    const hasScreenOverride =
        process.env.BACKUP_START_SCREEN &&
        process.env.BACKUP_START_SCREEN.length
    if (hasScreenOverride) {
        const override = process.env.BACKUP_START_SCREEN
        return override
    }

    if (localStorage.getItem('backup.restore.authenticating')) {
        localStorage.removeItem('backup.restore.authenticating')
        if (isAuthenticated) {
            return 'restore-running'
        } else {
            return 'restore-where'
        }
    }

    if (localStorage.getItem('backup.onboarding')) {
        if (localStorage.getItem('backup.onboarding.payment')) {
            localStorage.removeItem('backup.onboarding.payment')
            if (await remoteFunction('checkAutomaticBakupEnabled')()) {
                return 'onboarding-size'
            } else {
                return 'onboarding-how'
            }
        } else if (
            !isAuthenticated &&
            localStorage.getItem('backup.onboarding.authenticating')
        ) {
            localStorage.removeItem('backup.onboarding.authenticating')
            return 'onboarding-size'
        } else if (
            isAuthenticated &&
            !localStorage.getItem('backup.onboarding.where')
        ) {
            localStorage.removeItem('backup.onboarding.payment')
            localStorage.removeItem('backup.onboarding.authenticating')
            localStorage.removeItem('backup.onboarding')
            return 'running-backup'
        } else {
            localStorage.removeItem('backup.onboarding.where')
            localStorage.removeItem('backup.onboarding')
        }
    }

    return 'overview'
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

    const handlers = {
        overview: {
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
                    localStorage.setItem('backup.onboarding', true)
                    localStorage.setItem('backup.onboarding.where', true)
                    analytics.trackEvent({
                        category: 'Backup',
                        action: 'onboarding-triggered',
                    })
                    return { screen: 'onboarding-where' }
                }

                /* Navigate to Google Drive login if previous it is not authentication
                    else go to running backup */
                if (
                    backendLocation === 'google-drive' &&
                    !state.isAuthenticated
                ) {
                    return { redirect: { to: 'gdrive-login' } }
                } else {
                    return { screen: 'running-backup' }
                }
            },
            onRestoreRequested: () => {
                return { screen: 'restore-where' }
            },
            onPaymentRequested: () => {
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
                localStorage.removeItem('backup.onboarding.where')

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
                return { screen: 'running-backup' }
            },
        },
        'onboarding-how': {
            onChoice: async () => {
                const { choice } = event

                await analytics.trackEvent({
                    category: 'Backup',
                    action: 'onboarding-how-chosen',
                    value: choice,
                })

                if (choice.type === 'automatic') {
                    localStorage.setItem('backup.onboarding.payment', true)
                    return {
                        redirect: { to: 'automatic-backup-purchase', choice },
                    }
                } else {
                    return { screen: 'onboarding-size' }
                }
            },
            onBackRequested: () => {
                localStorage.setItem('backup.onboarding.where', true)
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
                return { screen: 'running-backup' }
            },
        },
        'running-backup': {
            onFinish: () => {
                localStorage.removeItem('backup.onboarding')
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
                    return { screen: 'restore-running' }
                }
            },
        },
        'restore-running': {
            onFinish: () => {
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
        'automatic-backup-purchase': () =>
            redirectToAutomaticBackupPurchase(redirect.choice.billingPeriod),
    }
    return redirects[redirect.to]()
}
