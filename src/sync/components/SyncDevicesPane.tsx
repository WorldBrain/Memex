// sync container
// - start sync, or this that on each device?? look at figma

// sync device

// options - ad remove

// Sync Start Panel:
//  Enable sync with mobile devices
//                start setup switch on or off
//
// if setup, show next row
// spacer

// connected devices list
// add on right colum
// simple text with remove

// initial sync setup (per device?)
// modal steppers,
// scan this qr code
// done
// show initial sync progress bar
// ability to cancel

import React, { PureComponent, Fragment, Component } from 'react'

import cx from 'classnames'
import ToggleSwitch from 'src/common-ui/components/ToggleSwitch'
import { SyncDevicesList } from 'src/sync/components/SyncDevicesList'
import { SyncDevice } from 'src/sync/components/types'
const styles = require('./styles.css')

interface Props {
    devices: SyncDevice[]
    isDeviceSyncEnabled: boolean
    isDeviceSyncAllowed: boolean
    handleRemoveDevice: any
}

interface State {
    isTogglingSync: boolean
}

export default class SyncDevicesPane extends Component<Props, State> {
    enableSync = () => {
        this.setState({ isTogglingSync: true })

        this.setState({ isTogglingSync: false })
    }

    disableSync = () => {
        this.setState({ isTogglingSync: true })

        this.setState({ isTogglingSync: false })
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
            <>
                {this.renderHeader()}
                {this.props.isDeviceSyncEnabled && this.renderDeviceList()}
            </>
        )
    }

    renderHeader() {
        return (
            <>
                <span>Sync with mobile devices</span>
                <span> Enabled: </span>{' '}
                <ToggleSwitch onChange={this.toggleSync} />
            </>
        )
    }

    renderDeviceList() {
        return (
            <>
                <span>Connected Devices</span>
                <span> Add New</span>
                <SyncDevicesList
                    devices={this.props.devices}
                    handleRemoveDevice={this.props.handleRemoveDevice}
                />
            </>
        )
    }
}
