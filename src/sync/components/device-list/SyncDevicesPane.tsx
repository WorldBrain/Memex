import React, { Component } from 'react'
import ToggleSwitch from 'src/common-ui/components/ToggleSwitch'
import { SyncDevicesList } from 'src/sync/components/device-list/SyncDevicesList'
import { SyncDevice } from 'src/sync/components/types'
import { LOGIN_URL } from 'src/constants'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { sync, auth, subscription } from 'src/util/remote-functions-background'
import InitialSyncSetup from 'src/sync/components/initial-sync/initial-sync-setup'
import { getRemoteEventEmitter } from 'src/util/webextensionRPC'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'
import analytics from 'src/analytics'
import { AuthContextInterface } from 'src/authentication/background/types'

const settingsStyle = require('src/options/settings/components/settings.css')
const styles = require('../styles.css')

export const subscriptionConfig = {
    site:
        process.env.NODE_ENV !== 'production'
            ? 'worldbrain-test'
            : 'worldbrain',
}

interface Props {
    devices: SyncDevice[]
    isDeviceSyncEnabled: boolean
    isDeviceSyncAllowed: boolean
    handleRemoveDevice: any
    getInitialSyncMessage: () => Promise<string>
    waitForInitialSync: () => Promise<void>
    waitForInitialSyncConnected: () => Promise<void>
    refreshDevices: () => Promise<void>
    handleUpgradeNeeded: () => void
    abortInitialSync: () => Promise<void>
    subscriptionStatus: string
}

interface State {
    isTogglingSync: boolean
    isAddingNewDevice: boolean
}

interface ContainerProps {
    onClose?: () => void
}

export class SyncDevicesPane extends Component<Props & ContainerProps, State> {
    state = { isTogglingSync: false, isAddingNewDevice: false }

    enableSync = () => {
        this.setState({ isTogglingSync: true })
    }

    disableSync = () => {
        this.setState({ isTogglingSync: false })
    }

    handleCloseNewDevice = () => {
        this.props.refreshDevices()
        this.render()

        this.setState({
            isAddingNewDevice: false,
        })
    }

    handleLoginNeeded = () => {
        window.location.href = LOGIN_URL
    }

    handleOpenNewDevice = () => {
        analytics.trackEvent({ category: 'Sync', action: 'clickPairNewDevice' })
        this.setState({
            isAddingNewDevice: true,
        })
    }

    toggleSync = () => {
        if (!this.state.isTogglingSync) {
            return this.props.isDeviceSyncEnabled
                ? this.disableSync()
                : this.enableSync()
        }
    }

    renderHeader() {
        return (
            <div className={styles.container}>
                <div className={styles.syncLeftCol}>
                    <span className={styles.syncHeaderText}>
                        Sync with mobile devices
                    </span>
                    <span className={styles.subText}>
                        {' '}
                        Save bookmarks from your mobile devices to your Memex
                        extension
                    </span>
                </div>

                <div className={styles.syncRightCol}>
                    <ToggleSwitch
                        onChange={this.toggleSync}
                        isChecked={this.props.isDeviceSyncEnabled}
                    />
                </div>
            </div>
        )
    }

    openPortal = async () => {
        const portalLink = await subscription.getManageLink()
        window.open(portalLink['access_url'])
    }

    renderDeviceList() {
        let pairButton

        if (
            !this.props.isDeviceSyncAllowed &&
            this.props.devices.length === 0
        ) {
            pairButton = (
                <ButtonTooltip
                    tooltipText="To use sync, please login and upgrade your subscription"
                    position="bottom"
                >
                    <SecondaryAction
                        onClick={this.props.handleUpgradeNeeded}
                        label={` Pair New Device`}
                    />
                </ButtonTooltip>
            )
        }

        if (this.props.devices.length > 0 && this.props.isDeviceSyncAllowed) {
            pairButton = (
                <ButtonTooltip
                    tooltipText="You currently can only sync one computer and one phone"
                    position="bottom"
                >
                    <SecondaryAction
                        onClick={null}
                        disabled
                        label={`All devices paired`}
                    />
                </ButtonTooltip>
            )
        }

        if (this.props.devices.length > 0 && !this.props.isDeviceSyncAllowed) {
            pairButton = (
                <ButtonTooltip
                    tooltipText="You need to be logged in to sync your devices"
                    position="bottom"
                >
                    <SecondaryAction
                        onClick={this.handleLoginNeeded}
                        label={`Login to Sync`}
                    />
                </ButtonTooltip>
            )
        }

        if (this.props.devices.length === 0 && this.props.isDeviceSyncAllowed) {
            pairButton = (
                <SecondaryAction
                    onClick={this.handleOpenNewDevice}
                    label={`Pair New Device`}
                />
            )
        }

        return (
            <div>
                {this.props.subscriptionStatus === 'in_trial' && (
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
                <div className={styles.container}>
                    <div className={styles.syncLeftCol}>
                        <ButtonTooltip
                            tooltipText="Until now only one extension and one app can be synced. Soon more."
                            position="bottom"
                        >
                            {this.props.devices.length > 0 ? (
                                <p className={styles.syncTitle}>
                                    2 of 2 Paired Devices
                                </p>
                            ) : (
                                <p className={styles.syncTitle}>
                                    No Paired Devices
                                </p>
                            )}
                        </ButtonTooltip>
                    </div>
                    {pairButton}
                </div>
                <SyncDevicesList
                    devices={this.props.devices}
                    handleRemoveDevice={this.props.handleRemoveDevice}
                />
            </div>
        )
    }

    renderAddNewDevice() {
        return (
            <InitialSyncSetup
                getInitialSyncMessage={this.props.getInitialSyncMessage}
                waitForInitialSyncConnected={
                    this.props.waitForInitialSyncConnected
                }
                waitForInitialSync={this.props.waitForInitialSync}
                abortInitialSync={this.props.abortInitialSync}
                getSyncEventEmitter={() => getRemoteEventEmitter('sync')}
                open={this.state.isAddingNewDevice}
                onClose={this.handleCloseNewDevice}
            />
        )
    }

    render() {
        return (
            <div className={styles.syncDevicesContainer}>
                {this.props.isDeviceSyncEnabled && this.renderDeviceList()}
                {this.renderAddNewDevice()}
            </div>
        )
    }
}

class SyncDevicesPaneContainer extends React.Component<
    AuthContextInterface & { showSubscriptionModal: () => void },
    {
        devices: SyncDevice[]
        featureSyncEnabled: boolean
    }
> {
    state = { devices: [], featureSyncEnabled: true }

    async componentDidMount() {
        await this.refreshDevices()
    }

    handleRemoveDevice = async (deviceId: string) => {
        await sync.removeDevice(deviceId)
        await this.refreshDevices()
    }

    getInitialSyncMessage = async () => {
        const { initialMessage } = await sync.requestInitialSync()
        analytics.trackEvent({
            category: 'Sync',
            action: 'generateQRPairingCode',
        })
        return initialMessage
    }

    waitForInitialSync = async () => {
        await sync.waitForInitialSync()
        await this.refreshDevices()
    }
    waitForInitialSyncConnected = async () => {
        await sync.waitForInitialSyncConnected()
    }

    abortInitialSync = async () => sync.abortInitialSync()

    refreshDevices = async () => {
        const devices = (await sync.listDevices()) as SyncDevice[]
        this.setState({ devices })
    }

    handleUpgradeNeeded = async () => {
        this.props.showSubscriptionModal()
    }

    render() {
        if (this.state.featureSyncEnabled === false) {
            return null
        }

        return (
            <div>
                <div className={settingsStyle.section}>
                    <div className={settingsStyle.sectionTitle}>
                        <div className={settingsStyle.sectionTitleText}>
                            <span>Sync your mobile phone</span>
                            <span className={settingsStyle.betaPill}>
                                {' '}
                                Beta
                            </span>
                        </div>
                        {!this.props.currentUser?.authorizedFeatures?.includes(
                            'sync',
                        ) && (
                            <span
                                className={styles.labelFree}
                                onClick={this.handleUpgradeNeeded}
                            >
                                ⭐️ Pro Feature
                            </span>
                        )}
                    </div>
                    <div className={settingsStyle.infoText}>
                        Use an end2end encrypted connection to keep your devices
                        in sync.
                    </div>
                    <div className={settingsStyle.infoTextSmall}>
                        <strong>
                            This feature is in beta status. You may experience
                            bugs.{' '}
                            <a
                                href="https://community.worldbrain.io/c/bug-reports"
                                target="_blank"
                            >
                                Let us know if you do!
                            </a>
                        </strong>
                    </div>
                    <SyncDevicesPane
                        devices={this.state.devices}
                        isDeviceSyncEnabled
                        isDeviceSyncAllowed={this.props.currentUser?.authorizedFeatures?.includes(
                            'sync',
                        )}
                        handleRemoveDevice={this.handleRemoveDevice}
                        handleUpgradeNeeded={this.handleUpgradeNeeded}
                        getInitialSyncMessage={this.getInitialSyncMessage}
                        waitForInitialSync={this.waitForInitialSync}
                        waitForInitialSyncConnected={
                            this.waitForInitialSyncConnected
                        }
                        refreshDevices={this.refreshDevices}
                        abortInitialSync={this.abortInitialSync}
                        subscriptionStatus={
                            this.props.currentUser?.subscriptionStatus
                        }
                    />
                </div>
                <div className={settingsStyle.section}>
                    <div className={styles.mobileSection}>
                        <div className={styles.contentSection}>
                            <div className={styles.textSection}>
                                <div className={settingsStyle.sectionTitle}>
                                    Download Memex GO
                                </div>
                                <div className={settingsStyle.infoText}>
                                    Our mobile app to save and organise websites
                                    on the Go
                                </div>
                            </div>
                            <div className={styles.storeSection}>
                                <img
                                    className={styles.downloadImg}
                                    src={'img/appStore.png'}
                                    onClick={() => {
                                        window.open(
                                            'https://apps.apple.com/app/id1471860331',
                                        )
                                    }}
                                />
                                <img
                                    className={styles.downloadImg}
                                    src={'img/googlePlay.png'}
                                    onClick={() => {
                                        window.open(
                                            'https://play.google.com/store/apps/details?id=io.worldbrain',
                                        )
                                    }}
                                />
                            </div>
                        </div>
                        <div className={styles.mobileContainer}>
                            <img
                                src={'img/mobileHalf.svg'}
                                className={styles.mobileImg}
                            />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default connect(null, dispatch => ({
    showSubscriptionModal: () => dispatch(show({ modalId: 'Subscription' })),
}))(withCurrentUser(SyncDevicesPaneContainer))
