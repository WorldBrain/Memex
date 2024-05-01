import React, { Component } from 'react'
import browser from 'webextension-polyfill'
import { remoteFunction } from 'src/util/webextensionRPC'
import analytics from 'src/analytics'
import { default as Overview } from './panes/overview'
import { default as RunningBackup } from './panes/running-backup'
import { default as OnboardingWhere } from './panes/setup-location'
import OnboardingHow from './panes/setup-manual-or-automatic'
import { default as OnboardingSize } from './panes/setup-size'
import LoadingBlocker from '../../../common-ui/components/loading-blocker'
import * as logic from 'src/backup-restore/ui/backup-pane/container.logic'
import RestoreWhere from 'src/backup-restore/ui/backup-pane/panes/restore-where'
import RestoreRunning from 'src/backup-restore/ui/backup-pane/panes/restore-running'
import type { UIServices } from 'src/services/ui/types'
import { BrowserSettingsStore } from 'src/util/settings'
import type { LocalBackupSettings } from 'src/backup-restore/background/types'

const styles = require('../styles.css')

export const SCREENS = {
    overview: {
        component: Overview,
        events: {
            onBackupRequested: { argument: 'changeBackupRequested' },
            onRestoreRequested: true,
            onBackupSetupRequested: true,
            onBlobPreferenceChange: { argument: 'saveBlobs' },
            onSubscribeRequested: { argument: 'choice' },
            onDumpRequested: true,
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

export interface Props {
    services: UIServices
}

export default class BackupSettingsContainer extends Component<Props> {
    localBackupSettings: BrowserSettingsStore<LocalBackupSettings>
    state = { screen: null, isAuthenticated: null, isDumpModalShown: false }

    constructor(props: Props) {
        super(props)

        this.localBackupSettings = new BrowserSettingsStore(
            browser.storage.local,
            { prefix: 'localBackup.' },
        )
    }

    async componentDidMount() {
        const state = await logic.getInitialState({
            analytics,
            remoteFunction,
            localBackupSettings: this.localBackupSettings,
        })
        this.setState(state)
    }

    private hideDumpModal = () => this.setState({ isDumpModalShown: false })

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
                localBackupSettings: this.localBackupSettings,
                analytics,
                remoteFunction,
            },
            onStateChange: (changes) => this.setState(changes),
            onRedirect: logic.doRedirect,
        })

        return React.createElement(screenConfig.component, {
            ...stateProps,
            ...handlers,
            localBackupSettings: this.localBackupSettings,
        })
    }

    render() {
        return (
            <div>
                {/* {this.state.isDumpModalShown && (
                    // <Overlay services={this.props.services}>
                    //     <DataDumper
                    //         supportLink={'mailto:' + SUPPORT_EMAIL}
                    //         services={this.props.services}
                    //         onComplete={this.hideDumpModal}
                    //         onCancel={this.hideDumpModal}
                    //     />
                    // </Overlay>
                )} */}
                <div className={styles.screenContainer}>
                    {this.renderScreen()}
                </div>
            </div>
        )
    }
}
