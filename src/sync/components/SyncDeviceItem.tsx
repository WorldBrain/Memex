import React, { Component } from 'react'
import { SyncDevice } from 'src/sync/components/types'

interface Props {
    device: SyncDevice
    handleRemoveDevice: any
}

export default class SyncDeviceItem extends Component<Props> {
    handleRemoveDevice = () => {
        this.props.handleRemoveDevice(this.props.device.id)
    }

    render() {
        const device = this.props.device
        return (
            <div>
                <span>{device.name}</span>
                <span onClick={this.handleRemoveDevice}>Remove</span>
            </div>
        )
    }
}
