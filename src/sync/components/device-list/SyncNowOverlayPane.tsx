import React, { Component } from 'react'
import { sync, auth, subscription } from 'src/util/remote-functions-background'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { SyncDevice } from 'src/sync/components/types'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'
import { AuthContextInterface } from 'src/authentication/background/types'

export const subscriptionConfig = {
    site:
        process.env.NODE_ENV !== 'production'
            ? 'worldbrain-test'
            : 'worldbrain',
}

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

    async componentDidMount() {
        this.setState({
            subscribed: await auth.hasSubscribedBefore(),
            showSubscriptionOptions: true,
        })
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

interface ContainerProps {
    showSubscriptionModal: () => void
    onClose?: () => void
    subscriptionChanged?: () => void
}
interface ContainerState {
    showSync: boolean
    syncResults: any
    syncError: any
    isSyncing: boolean
    devices: SyncDevice[]
}
export class SyncNowOverlayPaneContainer extends Component<
    ContainerProps & AuthContextInterface,
    ContainerState
> {
    state = {
        showSync: false,
        syncResults: [],
        syncError: null,
        isSyncing: false,
        devices: [],
        subscribed: null,
        showSubscriptionOptions: true,
    }

    refreshDevices = async () => {
        const devices = (await sync.listDevices()) as SyncDevice[]
        this.setState({ devices })
    }

    componentDidMount() {
        this.refreshDevices()
    }

    handleOnClickSync = async () => {
        this.setState({ isSyncing: true })
        const syncing = await sync.forceIncrementalSync()
        // console.log("UI: Sync completed with",syncing)
        this.setState({ isSyncing: false })
        window.location.reload()
    }

    handleUpgrade = async () => {
        this.props.showSubscriptionModal()
    }

    handleLogin = async () => {
        window.location.href = '#/account'
    }

    handlePairing = async () => {
        window.location.href = '#/sync'
    }

    openPortal = async () => {
        const portalLink = await subscription.getManageLink()
        window.open(portalLink['access_url'])
    }

    render() {
        const syncFeatureAllowed = this.props.currentUser?.authorizedFeatures?.includes(
            'sync',
        )

        return (
            <div>
                {this.props.currentUser?.subscriptionStatus === 'in_trial' && (
                    <div>
                        <div
                            onClick={this.openPortal}
                            className={settingsStyle.trialNotif}
                        >
                            <div className={settingsStyle.trialHeader}>
                                <strong>Trial Period active</strong>
                            </div>
                            <div>
                                Add payment details to prevent interruptions
                            </div>
                        </div>
                    </div>
                )}
                {this.state.devices.length === 0 && syncFeatureAllowed && (
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

                {this.props.currentUser === null && (
                    <div className={settingsStyle.buttonArea}>
                        <div>
                            <div className={settingsStyle.sectionTitle}>
                                Sync Status
                            </div>
                            <div className={settingsStyle.infoText}>
                                Login to enable sync
                            </div>
                        </div>
                        <SyncNowOverlayPane
                            onClickSync={this.handleLogin}
                            isSyncing={this.state.isSyncing}
                            label={'Login'}
                        />
                    </div>
                )}
                {!syncFeatureAllowed && this.props.currentUser && (
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

                {syncFeatureAllowed &&
                    this.state.devices.length > 0 &&
                    !this.state.isSyncing && (
                        <div className={settingsStyle.buttonArea}>
                            <div>
                                <div className={settingsStyle.sectionTitle}>
                                    Sync Enabled
                                </div>
                                <div className={settingsStyle.infoText}>
                                    Syncs every 2 minutes
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

export default connect(null, (dispatch) => ({
    showSubscriptionModal: () => dispatch(show({ modalId: 'Subscription' })),
}))(withCurrentUser(SyncNowOverlayPaneContainer))
