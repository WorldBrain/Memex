import React from 'react'
import * as mapValues from 'lodash/mapValues'
import {
    redirectToGDriveLogin,
    redirectToAutomaticBackupPurchase,
} from 'src/options/backup/utils'

export async function getInitialState({
    analytics,
    localStorage,
    remoteFunction,
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
}) {
    const hasScreenOverride =
        process.env.BACKUP_START_SCREEN &&
        process.env.BACKUP_START_SCREEN.length
    if (hasScreenOverride) {
        const override = process.env.BACKUP_START_SCREEN
        console.log('Backup screen override:', override)
        return override
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
        } else if (isAuthenticated) {
            localStorage.removeItem('backup.onboarding.payment')
            localStorage.removeItem('backup.onboarding.authenticating')
            localStorage.removeItem('backup.onboarding')
            return 'running-backup'
        } else {
            return 'onboarding-where'
        }
    } else {
        const [hasInitialBackup, backupInfo] = await Promise.all([
            remoteFunction('hasInitialBackup')(),
            remoteFunction('getBackupInfo')(),
        ])
        if (!hasInitialBackup && !backupInfo) {
            localStorage.setItem('backup.onboarding', true)
            analytics.trackEvent(
                {
                    category: 'Backup',
                    action: 'onboarding-triggered',
                },
                true,
            )
            return 'onboarding-where'
        } else {
            return 'overview'
        }
    }
}

export async function processEvent({
    state,
    event,
    localStorage,
    analytics,
    remoteFunction,
}) {
    const handlers = {
        overview: {
            onBackupRequested: () => {
                if (state.isAuthenticated) {
                    return { screen: 'running-backup' }
                } else {
                    return { redirect: { to: 'gdrive-login' } }
                }
            },
        },
        'onboarding-where': {
            onChoice: async () => {
                analytics.trackEvent(
                    {
                        category: 'Backup',
                        action: 'onboarding-where-chosen',
                    },
                    true,
                )

                const isAutomaticBackupEnabled = await remoteFunction(
                    'isAutomaticBackupEnabled',
                )()
                if (isAutomaticBackupEnabled) {
                    return { screen: 'onboarding-size' }
                } else {
                    return { screen: 'onboarding-how' }
                }
            },
        },
        'onboarding-how': {
            onChoice: async () => {
                const { choice } = event

                await analytics.trackEvent(
                    {
                        category: 'Backup',
                        action: 'onboarding-how-chosen',
                        value: choice,
                    },
                    true,
                )

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
                return { screen: 'onboarding-where' }
            },
        },
        'onboarding-size': {
            onBlobPreferenceChange: () => {
                analytics.trackEvent(
                    {
                        category: 'Backup',
                        action: 'onboarding-blob-pref-change',
                        value: event.saveBlobs,
                    },
                    true,
                )
                remoteFunction('setBackupBlobs')(event.saveBlobs)
                return {}
            },
            onLoginRequested: () => {
                analytics.trackEvent(
                    {
                        category: 'Backup',
                        action: 'onboarding-login-requested',
                    },
                    true,
                )
                localStorage.setItem('backup.onboarding.authenticating', true)
                return { redirect: { to: 'gdrive-login' } }
            },
            onBackupRequested: () => {
                analytics.trackEvent(
                    {
                        category: 'Backup',
                        action: 'onboarding-backup-requested',
                    },
                    true,
                )
                return { screen: 'running-backup' }
            },
        },
        'running-backup': {
            onFinish: () => {
                localStorage.removeItem('backup.onboarding')
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
export const getScreenStateProps = ({
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
