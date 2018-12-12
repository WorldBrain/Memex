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
import * as logic from 'src/options/backup/container.logic'
const STYLES = require('./styles.css')

export const SCREENS = {
    overview: {
        component: Overview,
        events: { onBackupRequested: true, onRestoreRequested: true },
    },
    'running-backup': {
        component: RunningBackup,
        events: { onFinish: true },
    },
    'onboarding-where': {
        component: OnboardingWhere,
        events: { onChoice: { argument: 'choice' } },
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
        state: { isAuthenticated: true },
        events: {
            onBlobPreferenceChange: { argument: 'saveBlobs' },
            onLoginRequested: true,
            onBackupRequested: true,
        },
    },
}

export default class BackupSettingsContainer extends React.Component {
    state = { screen: null, isAuthenticated: null }

    async componentDidMount() {
        this.setState(
            await logic.getInitialState({
                analytics,
                localStorage,
                remoteFunction,
            }),
        )
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
                <div className={STYLES.screenContainer}>
                    {this.renderScreen()}
                </div>
            </div>
        )
    }
}
