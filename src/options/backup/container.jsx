import React from 'react'
// import PropTypes from 'prop-types'
import { remoteFunction } from 'src/util/webextensionRPC'
import analytics from 'src/analytics'
import {
    redirectToGDriveLogin,
    redirectToAutomaticBackupPurchase,
} from './utils'
import { default as Overview } from './screens/overview'
import { default as RunningBackup } from './screens/running-backup'
import { default as OnboardingWhere } from './screens/onboarding-1-where'
import { default as OnboardingHow } from './screens/onboarding-2-how'
import { default as OnboardingSize } from './screens/onboarding-3-size'
import { BackupHeader } from './components/backup-header'
import LoadingBlocker from './components/loading-blocker'
import Styles from './styles.css'

export default class BackupSettingsContainer extends React.Component {
    state = { screen: null, isAuthenticated: null }

    async componentDidMount() {
        const isAuthenticated = await remoteFunction('isBackupAuthenticated')()
        this.setState({ isAuthenticated })

        if (
            !(
                process.env.BACKUP_START_SCREEN &&
                process.env.BACKUP_START_SCREEN.length
            )
        ) {
            if (localStorage.getItem('backup.onboarding')) {
                if (localStorage.getItem('backup.onboarding.payment')) {
                    localStorage.removeItem('backup.onboarding.payment')
                    if (await remoteFunction('checkAutomaticBakupEnabled')()) {
                        this.setState({ screen: 'onboarding-size' })
                    } else {
                        this.setState({ screen: 'onboarding-how' })
                    }
                } else if (
                    !isAuthenticated &&
                    localStorage.getItem('backup.onboarding.authenticating')
                ) {
                    localStorage.removeItem('backup.onboarding.authenticating')
                    this.setState({ screen: 'onboarding-size' })
                } else if (isAuthenticated) {
                    localStorage.removeItem('backup.onboarding.payment')
                    localStorage.removeItem('backup.onboarding.authenticating')
                    localStorage.removeItem('backup.onboarding')
                    this.setState({ screen: 'running-backup' })
                } else {
                    this.setState({ screen: 'onboarding-where' })
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
                    this.setState({ screen: 'onboarding-where' })
                } else {
                    this.setState({ screen: 'overview' })
                }
            }
        } else {
            const override = process.env.BACKUP_START_SCREEN
            console.log('Backup screen override:', override)
            this.setState({ screen: override })
        }
    }

    renderScreen() {
        const { screen } = this.state
        if (!screen) {
            return <LoadingBlocker />
        }

        if (screen === 'overview') {
            return (
                <Overview
                    onBackupRequested={() => {
                        if (this.state.isAuthenticated) {
                            this.setState({ screen: 'running-backup' })
                        } else {
                            redirectToGDriveLogin()
                        }
                    }}
                />
            )
        } else if (screen === 'running-backup') {
            return (
                <RunningBackup
                    onFinish={() => {
                        localStorage.removeItem('backup.onboarding')
                        this.setState({ screen: 'overview' })
                    }}
                />
            )
        } else if (screen === 'onboarding-where') {
            return (
                <OnboardingWhere
                    onChoice={async choice => {
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
                            this.setState({ screen: 'onboarding-size' })
                        } else {
                            this.setState({ screen: 'onboarding-how' })
                        }
                    }}
                />
            )
        } else if (screen === 'onboarding-how') {
            return (
                <OnboardingHow
                    onChoice={async choice => {
                        await analytics.trackEvent(
                            {
                                category: 'Backup',
                                action: 'onboarding-how-chosen',
                                value: choice,
                            },
                            true,
                        )

                        if (choice.type === 'automatic') {
                            localStorage.setItem(
                                'backup.onboarding.payment',
                                true,
                            )
                            redirectToAutomaticBackupPurchase(
                                choice.billingPeriod,
                            )
                        } else {
                            this.setState({ screen: 'onboarding-size' })
                        }
                    }}
                    onBackRequested={() => {
                        this.setState({ screen: 'onboarding-where' })
                    }}
                />
            )
        } else if (screen === 'onboarding-size') {
            return (
                <OnboardingSize
                    isAuthenticated={this.state.isAuthenticated}
                    onBlobPreferenceChange={saveBlobs => {
                        analytics.trackEvent(
                            {
                                category: 'Backup',
                                action: 'onboarding-blob-pref-change',
                                value: saveBlobs,
                            },
                            true,
                        )
                        remoteFunction('setBackupBlobs')(saveBlobs)
                    }}
                    onLoginRequested={() => {
                        analytics.trackEvent(
                            {
                                category: 'Backup',
                                action: 'onboarding-login-requested',
                            },
                            true,
                        )
                        localStorage.setItem(
                            'backup.onboarding.authenticating',
                            true,
                        )
                        redirectToGDriveLogin()
                    }}
                    onBackupRequested={() => {
                        analytics.trackEvent(
                            {
                                category: 'Backup',
                                action: 'onboarding-backup-requested',
                            },
                            true,
                        )
                        this.setState({ screen: 'running-backup' })
                    }}
                />
            )
        } else {
            console.error(`Unknown screen: ${this.state.screen}`)
            throw new Error('This should never happen')
        }
    }

    render() {
        return (
            <div>
                <BackupHeader />
                <div className={Styles.screenContainer}>
                    {this.renderScreen()}
                </div>
            </div>
        )
    }
}

// export async function _getCurrentScreen() {
//     const isAuthenticated = await remoteFunction('isBackupAuthenticated')()
// }
