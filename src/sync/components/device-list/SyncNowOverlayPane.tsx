import React, { Component } from 'react'
import { features, sync } from 'src/util/remote-functions-background'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import {
    UserProps,
    withCurrentUser,
} from 'src/authentication/components/AuthConnector'
import { WhiteSpacer20 } from 'src/common-ui/components/design-library/typography'
import { SyncDevice } from 'src/sync/components/types'

interface Props {
    onClickSync: () => void
    isSyncing: boolean
    label: string
}
const settingsStyle = require('src/options/settings/components/settings.css')

export class SyncNowOverlayPane extends Component<Props> {
    renderSyncNowButton() {
        if (this.props.isSyncing) {
            return (
                <PrimaryAction 
                    disabled={true} 
                    onClick={() => false}
                    label={'Syncing....'}
                />
            )
        } else {
            return (
                <PrimaryAction 
                    onClick={this.props.onClickSync}
                    label={this.props.label}
                />
            )
        }
    }

    renderSyncResults() {}

    render() {
        return (
            <div>
                {this.renderSyncNowButton()}
                {this.renderSyncResults()}
            </div>
        )
    }
}

interface ContainerProps {}
interface ContainerState {
    showSync: boolean
    syncEnabled: boolean
    syncAllowed: boolean
    syncResults: any
    syncError: any
    isSyncing: boolean
    devices: SyncDevice[]
}
export class SyncNowOverlayPaneContainer extends Component<
    ContainerProps & UserProps,
    ContainerState
> {
    state = {
        showSync: false,
        syncEnabled: true,
        syncAllowed: false,
        syncResults: [],
        syncError: null,
        isSyncing: false,
        devices: []
    }

    refreshDevices = async () => {
        const devices = (await sync.listDevices()) as SyncDevice[]
        this.setState({ devices })
    }

    async componentDidMount() {
        const syncFeatureAllowed = this.props.authorizedFeatures.includes(
            'sync',
        )
        await this.refreshDevices()

        this.setState({
            syncAllowed: syncFeatureAllowed,
        })
    }

    async componentDidUpdate() {
        const syncFeatureAllowed = this.props.authorizedFeatures.includes(
            'sync',
        )
        this.setState({
            syncAllowed: syncFeatureAllowed,
        })
    }

    handleOnClickSync = async () => {
        this.setState({ isSyncing: true })
        const syncing = await sync.forceIncrementalSync()
        // console.log("UI: Sync completed with",syncing)
        this.setState({ isSyncing: false })
        window.location.reload()
    }

    handleUpgrade = async () => {
        window.open('https://getmemex.com/#pricingSection')
    }

    handleLogin = async () => {
        window.location.href = '#/account'
    }

    handlePairing = async () => {
        window.location.href = '#/sync'
    }

    render() {
        return (
            <div>
                {(this.state.devices.length === 0 && this.state.syncAllowed) && (
                    <div className={settingsStyle.buttonArea}>
                        <div>
                            <div className={settingsStyle.sectionTitle}>
                                Sync Status
                            </div>
                            <div className={settingsStyle.infoText}>
                                No device paired yet
                            </div>
                        </div>
                        <SyncNowOverlayPane
                            onClickSync={this.handlePairing}
                            isSyncing={this.state.isSyncing}
                            label={'Pair Device'}
                        />
                    </div>
                )}

                {(this.state.syncEnabled && !this.state.syncAllowed) && (
                    <div className={settingsStyle.buttonArea}>
                        <div>
                            <div className={settingsStyle.sectionTitle}>
                                Sync Status
                            </div>
                            <div className={settingsStyle.infoText}>
                                Login to continue syncing
                            </div>
                        </div>
                        <SyncNowOverlayPane
                            onClickSync={this.handleLogin}
                            isSyncing={this.state.isSyncing}
                            label={'Login'}
                        />
                    </div>
                )}
                {(!this.state.syncEnabled && !this.state.syncAllowed) && (
                    <div className={settingsStyle.buttonArea}>
                        <div>
                            <div className={settingsStyle.sectionTitle}>
                                Sync Status
                            </div>
                            <div className={settingsStyle.infoText}>
                                Upgrade to sync your devices
                            </div>
                        </div>
                        <SyncNowOverlayPane
                            onClickSync={this.handleUpgrade}
                            isSyncing={this.state.isSyncing}
                            label={'⭐️ Upgrade'}
                        />
                    </div>
                )}

                {(this.state.syncAllowed && this.state.devices.length > 0 && !this.state.isSyncing) && (
                    <div className={settingsStyle.buttonArea}>
                        <div>
                             <div className={settingsStyle.sectionTitle}>
                                Sync Enabled
                            </div>
                            <div className={settingsStyle.infoText}>
                                Syncs every 5 min.
                            </div>
                        </div>
                        <SyncNowOverlayPane
                            onClickSync={this.handleOnClickSync}
                            isSyncing={this.state.isSyncing}
                            label={'Sync Now'}
                        />
                    </div>
                )}

                {this.state.isSyncing && (
                    <div className={settingsStyle.buttonArea}>
                        <div>
                            <div className={settingsStyle.sectionTitle}>
                                Sync Status
                            </div>
                            <div className={settingsStyle.infoText}>
                                Sync in Progress
                            </div>
                        </div>
                        <SyncNowOverlayPane
                            onClickSync={this.handleOnClickSync}
                            isSyncing={this.state.isSyncing}
                            label={null}
                        />
                    </div>
                )}
                {this.state.syncError && (
                    <div className={settingsStyle.buttonArea}>
                        <div>
                            <div className={settingsStyle.sectionTitle}>
                                Sync Failed
                            </div>
                            <div className={settingsStyle.infoText}>
                                There has been an error
                            </div>
                        </div>
                        <SyncNowOverlayPane
                            onClickSync={this.handleOnClickSync}
                            isSyncing={this.state.isSyncing}
                            label={'Try again'}
                        />
                    </div>
                )}
            </div>
        )
    }
}

export default withCurrentUser(SyncNowOverlayPaneContainer)
