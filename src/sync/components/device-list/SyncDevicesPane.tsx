import React, { Component } from 'react'
import ToggleSwitch from 'src/common-ui/components/ToggleSwitch'
import { SyncDevicesList } from 'src/sync/components/device-list/SyncDevicesList'
import { SyncDevice } from 'src/sync/components/types'
import Modal from 'src/common-ui/components/Modal'
import {
    UserProps,
    withCurrentUser,
} from 'src/authentication/components/AuthConnector'
import { features, sync } from 'src/util/remote-functions-background'
import SmallButton from '../../../common-ui/components/small-button'
import InitialSyncSetup from 'src/sync/components/initial-sync/initial-sync-setup'
import { getRemoteEventEmitter } from 'src/util/webextensionRPC'
const globalStyles = require('../../../backup-restore/ui/styles.css')
const styles = require('../styles.css')

interface Props {
    devices: SyncDevice[]
    isDeviceSyncEnabled: boolean
    isDeviceSyncAllowed: boolean
    handleRemoveDevice: any
    getInitialSyncMessage: () => Promise<string>
    waitForInitialSync: () => Promise<void>
    waitForInitialSyncConnected: () => Promise<void>
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
        this.setState({
            isAddingNewDevice: false,
        })
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
        return (
            <div>
                <div className={styles.container}>
                    <div className={styles.syncLeftCol}>
                        <span className={styles.syncTitle}>
                            CONNECTED DEVICES
                        </span>
                    </div>
                    <SmallButton
                        color="green"
                        onClick={this.handleOpenNewDevice}
                    >
                        + Add New
                    </SmallButton>
                </div>
                <hr />
                <SyncDevicesList
                    devices={this.props.devices}
                    handleRemoveDevice={this.props.handleRemoveDevice}
                />
            </div>
        )
    }

    renderAddNewDevice() {
        return (
            <Modal large onClose={this.handleCloseNewDevice}>
                <InitialSyncSetup
                    onClose={this.handleCloseNewDevice}
                    getInitialSyncMessage={this.props.getInitialSyncMessage}
                    waitForInitialSyncConnected={
                        this.props.waitForInitialSyncConnected
                    }
                    waitForInitialSync={this.props.waitForInitialSync}
                    getSyncEventEmitter={() => getRemoteEventEmitter('sync')}
                />
            </Modal>
        )
    }

    render() {
        return (
            <div className={styles.syncDevicesContainer}>
                {this.props.isDeviceSyncEnabled && this.renderDeviceList()}
                {this.state.isAddingNewDevice && this.renderAddNewDevice()}
            </div>
        )
    }
}

class SyncDevicesPaneContainer extends Component<
    UserProps,
    { devices: SyncDevice[]; feature: boolean }
> {
    state = { devices: [], feature: false }

    async componentDidMount() {
        this.refreshDevices()
        this.setState({ feature: await features.getFeature('Sync') })
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
        this.refreshDevices()
    }
    waitForInitialSyncConnected = async () => {
        await sync.waitForInitialSyncConnected()
    }

    refreshDevices = async () => {
        const devices = (await sync.listDevices()) as SyncDevice[]
        this.setState({ devices })
    }

    render() {
        if (this.state.feature === false) {
            return null
        }

        return (
            <div className={styles.section}>
                <p className={globalStyles.backupTitle}>
                    Syncing between Devices
                </p>
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
                />
            </div>
        )
    }
}

export default withCurrentUser(SyncDevicesPaneContainer)
