import React, { Component } from 'react'
import ToggleSwitch from 'src/common-ui/components/ToggleSwitch'
import { SyncDevicesList } from 'src/sync/components/device-list/SyncDevicesList'
import { SyncDevice } from 'src/sync/components/types'
import { UPGRADE_URL, LOGIN_URL } from 'src/constants'
import {
    UserProps,
    withCurrentUser,
} from 'src/authentication/components/AuthConnector'
import { features, sync } from 'src/util/remote-functions-background'
import InitialSyncSetup from 'src/sync/components/initial-sync/initial-sync-setup'
import { getRemoteEventEmitter } from 'src/util/webextensionRPC'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
const settingsStyle = require('src/options/settings/components/settings.css')
const styles = require('../styles.css')

interface Props {
    devices: SyncDevice[]
    isDeviceSyncEnabled: boolean
    isDeviceSyncAllowed: boolean
    handleRemoveDevice: any
    getInitialSyncMessage: () => Promise<string>
    waitForInitialSync: () => Promise<void>
    waitForInitialSyncConnected: () => Promise<void>
    refreshDevices: () => Promise<void>
}

interface State {
    isTogglingSync: boolean
    isAddingNewDevice: boolean
}

export class SyncDevicesPane extends Component<Props, State> {
    state = { isTogglingSync: false, isAddingNewDevice: false }

    enableSync = () => {
        this.setState({ isTogglingSync: true })

        this.setState({ isTogglingSync: false })
    }

    disableSync = () => {
        this.setState({ isTogglingSync: true })

        this.setState({ isTogglingSync: false })
    }

    handleCloseNewDevice = () => {
        this.props.refreshDevices()
        this.render()

        this.setState({
            isAddingNewDevice: false,
        })
    }

    handleUpgradeNeeded = () => {
        window.open(UPGRADE_URL, '_blank')
    }

    handleLoginNeeded = () => {
        window.location.href = LOGIN_URL
    }

    handleOpenNewDevice = () => {
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
                        onClick={this.handleUpgradeNeeded}
                        label={` Pair New Device`}
                    />
                </ButtonTooltip>
            )
        }

        if (this.props.devices.length > 0 && this.props.isDeviceSyncAllowed) {
            pairButton = null
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
    UserProps,
    { devices: SyncDevice[]; featureSyncEnabled: boolean }
> {
    state = { devices: [], featureSyncEnabled: false }

    async componentDidMount() {
        await this.refreshDevices()
        this.setState({ featureSyncEnabled: await features.getFeature('Sync') })
    }

    handleRemoveDevice = async (deviceId: string) => {
        await sync.removeDevice(deviceId)
        await this.refreshDevices()
    }

    getInitialSyncMessage = async () => {
        return (await sync.requestInitialSync()).initialMessage
    }

    waitForInitialSync = async () => {
        await sync.waitForInitialSync()
        await this.refreshDevices()
    }
    waitForInitialSyncConnected = async () => {
        await sync.waitForInitialSyncConnected()
    }

    refreshDevices = async () => {
        const devices = (await sync.listDevices()) as SyncDevice[]
        this.setState({ devices })
    }

    render() {
        if (this.state.featureSyncEnabled === false) {
            return null
        }

        return (
            <div>
                <div className={settingsStyle.section}>
                    <div className={settingsStyle.sectionTitle}>
                        Sync your mobile phone
                        <span
                                className={styles.labelFree}
                            >
                                ⭐️ Pro Feature
                        </span>
                    </div>
                    <div className={settingsStyle.infoText}>
                        Use an end2end encrypted connection to keep your devices in sync.
                    </div>
                    <SyncDevicesPane
                        devices={this.state.devices}
                        isDeviceSyncEnabled
                        isDeviceSyncAllowed={this.props.authorizedFeatures.includes(
                            'sync',
                        )}
                        handleRemoveDevice={this.handleRemoveDevice}
                        getInitialSyncMessage={this.getInitialSyncMessage}
                        waitForInitialSync={this.waitForInitialSync}
                        waitForInitialSyncConnected={
                            this.waitForInitialSyncConnected
                        }
                        refreshDevices={this.refreshDevices}
                    />
                </div>
                <div className={settingsStyle.section}>
                        <div className={styles.mobileSection}>
                            <div className={styles.contentSection}>
                                <div className={settingsStyle.sectionTitle}>
                                    Download Memex GO
                                </div>
                                <div className={settingsStyle.infoText}>
                                    Our mobile app to save and organise websites on the Go
                                </div>
                                <div>
                                    <img
                                        className={styles.downloadImg}
                                        src={'img/appStore.png'}
                                    />
                                    <img
                                        className={styles.downloadImg}
                                        src={'img/googlePlay.png'}
                                    />
                                </div>
                            </div>
                            <img 
                                src={'img/mobilehalf.png'}
                                className={styles.mobileImg}
                            />
                        </div>
                </div>
            </div>
        )
    }
}

export default withCurrentUser(SyncDevicesPaneContainer)
