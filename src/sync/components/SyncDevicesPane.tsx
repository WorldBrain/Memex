import React, { PureComponent, Fragment, Component } from 'react'
import cx from 'classnames'
import ToggleSwitch from 'src/common-ui/components/ToggleSwitch'
import { SyncDevicesList } from 'src/sync/components/SyncDevicesList'
import { SyncDevice } from 'src/sync/components/types'
import Modal from 'src/common-ui/components/Modal'
import InitialSyncStepper from 'src/sync/components/initial-sync/InitialSyncStepper'
const styles = require('./styles.css')

interface Props {
    devices: SyncDevice[]
    isDeviceSyncEnabled: boolean
    isDeviceSyncAllowed: boolean
    handleRemoveDevice: any
}

interface State {
    isTogglingSync: boolean
    isAddingNewDevice: boolean
}

export default class SyncDevicesPane extends Component<Props, State> {
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

    render() {
        return (
            <div className={styles.syncDevicesContainer}>
                {this.renderHeader()}
                {this.props.isDeviceSyncEnabled && this.renderDeviceList()}
                {this.state.isAddingNewDevice && this.renderAddNewDevice()}
            </div>
        )
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
                <hr />
                <div className={styles.container}>
                    <div className={styles.syncLeftCol}>
                        <span className={styles.syncSubText}>
                            Connected Devices
                        </span>
                    </div>
                    <div
                        className={styles.syncRightCol}
                        onClick={this.handleOpenNewDevice}
                    >
                        <div className={styles.button}>Add New</div>
                    </div>
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
            <Modal onClose={this.handleCloseNewDevice}>
                <InitialSyncStepper onFinish={this.handleCloseNewDevice} />
            </Modal>
        )
    }
}
