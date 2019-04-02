import React from 'react'

import { remoteFunction } from 'src/util/webextensionRPC'
import analytics from 'src/analytics'
import { default as Overview } from './screens/overview'
import { default as RunningBackup } from './screens/running-backup'
import { default as OnboardingWhere } from './screens/onboarding-1-where'
import { default as OnboardingHow } from './screens/onboarding-2-how'
import { default as OnboardingSize } from './screens/onboarding-3-size'
import { BackupHeader } from './components/backup-header'
import LoadingBlocker from './components/loading-blocker'
import * as logic from 'src/options/backup/container.logic'
import RestoreWhere from 'src/options/backup/screens/restore-where'
import RestoreRunning from 'src/options/backup/screens/restore-running'

const styles = require('./styles.css')
window['remoteFunction'] = remoteFunction
export const SCREENS = {
    overview: {
        component: Overview,
        events: {
            onBackupRequested: { argument: 'changeBackupRequested' },
            onRestoreRequested: true,
            onBlobPreferenceChange: { argument: 'saveBlobs' },
            onPaymentRequested: { argument: 'choice' },
        },
    },
    'running-backup': {
        component: RunningBackup,
        events: { onFinish: true },
    },
    'onboarding-where': {
        component: OnboardingWhere,
        events: {
            onChoice: { argument: 'choice' },
            onChangeLocalLocation: true,
        },
    },
    'onboarding-how': {
        component: OnboardingHow,
        events: {
            onChoice: { argument: 'choice' },
            onBackRequested: true,
        },
    },
    'onboarding-size': {
        component: OnboardingSize,
        state: {
            isAuthenticated: true,
        },
        events: {
            onBlobPreferenceChange: { argument: 'saveBlobs' },
            onLoginRequested: true,
            onBackupRequested: true,
        },
    },
    'restore-where': {
        component: RestoreWhere,
        events: {
            onChoice: { argument: 'choice' },
        },
    },
    'restore-running': {
        component: RestoreRunning,
        events: {
            onFinish: true,
        },
    },
}

export default class BackupSettingsContainer extends React.Component {
    state = { screen: null, isAuthenticated: null }

    async componentDidMount() {
        // analytics.trackEvent({ category: 'Test', action: 'New Event' })

        const state = await logic.getInitialState({
            analytics,
            localStorage,
            remoteFunction,
        })
        this.setState(state)
    }

    renderScreen() {
        const { screen } = this.state
        if (!screen) {
            return <LoadingBlocker />
        }

        const screenConfig = SCREENS[screen]
        if (!screenConfig) {
            console.error(`Unknown screen: ${this.state.screen}`)
            throw new Error('This should never happen')
        }

        const stateProps = logic.getScreenProps({
            state: this.state,
            screenConfig,
        })
        const handlers = logic.getScreenHandlers({
            state: this.state,
            screenConfig,
            eventProcessor: logic.processEvent,
            dependencies: {
                localStorage,
                analytics,
                remoteFunction,
            },
            onStateChange: changes => this.setState(changes),
            onRedirect: logic.doRedirect,
        })

        return React.createElement(screenConfig.component, {
            ...stateProps,
            ...handlers,
        })
    }

    render() {
        return (
            <div>
                <BackupHeader />
                <div className={styles.screenContainer}>
                    {this.renderScreen()}
                </div>
            </div>
        )
    }
}
