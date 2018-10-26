import React from 'react'
// import PropTypes from 'prop-types'
import { remoteFunction } from 'src/util/webextensionRPC'
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

export default class BackupSettingsContainer extends React.Component {
    state = { screen: null, isAuthenticated: null }

    async componentDidMount() {
        const isAuthenticated = await remoteFunction('isBackupAuthenticated')()
        this.setState({ isAuthenticated })

        this.setState({ screen: 'overview' })
        if (localStorage.getItem('backup.onboarding')) {
            if (localStorage.getItem('backup.onboarding.payment')) {
                localStorage.removeItem('backup.onboarding.payment')
                // Checking with subscription system can be done in the bg,
                // as we won't be using this info very soon, so no await
                remoteFunction('checkAutomaticBakupEnabled')()
                this.setState({ screen: 'onboarding-size' })
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
            }
        } else if (!(await remoteFunction('hasInitialBackup')())) {
            localStorage.setItem('backup.onboarding', true)
            this.setState({ screen: 'onboarding-where' })
        } else {
            this.setState({ screen: 'overview' })
        }
    }

    renderScreen() {
        const { screen } = this.state
        if (!screen) {
            return null
        }

        if (screen === 'overview') {
            return (
                <Overview
                    onBackupRequested={() => {
                        if (this.state.isAuthenticated) {
                            this.setState({ page: 'running-backup' })
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
                        this.setState({ screen: 'overview' })
                    }}
                />
            )
        } else if (screen === 'onboarding-where') {
            return (
                <OnboardingWhere
                    onChoice={async choice => {
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
                    onChoice={choice => {
                        if (choice.type === 'automatic') {
                            localStorage.setItem(
                                'backup.onboarding.payment',
                                true,
                            )
                            redirectToAutomaticBackupPurchase()
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
                        remoteFunction('setBackupBlobs')(saveBlobs)
                    }}
                    onLoginRequested={() => {
                        localStorage.setItem(
                            'backup.onboarding.authenticating',
                            true,
                        )
                        redirectToGDriveLogin()
                    }}
                    onBackupRequested={() => {
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
                {this.renderScreen()}
            </div>
        )
    }
}

// export async function _getCurrentScreen() {
//     const isAuthenticated = await remoteFunction('isBackupAuthenticated')()
// }
