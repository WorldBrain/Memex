import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { SyncDevice } from 'src/sync/components/types'
import Button from 'src/popup/components/Button'
import moment from 'moment'
import styled from 'styled-components'
import { formatTime } from 'src/util/time'

interface Props {
    device: SyncDevice
    handleRemoveDevice: (deviceId: string) => void
}

export default class SyncDeviceItem extends Component<Props> {
    handleRemoveDevice = () => {
        this.props.handleRemoveDevice(this.props.device.deviceId)
    }

    render() {
        const device = this.props.device
        return (
            <DeviceRow>
                <Item>{device.deviceId}</Item>
                <Item> {device.devicePlatform}</Item>
                <Item> {device.productType}</Item>
                <Item> Created: {formatTime(device.createdWhen, true)}</Item>
                <RemoveButton onClick={this.handleRemoveDevice}>
                    Remove
                </RemoveButton>
            </DeviceRow>
        )
    }
}

const DeviceRow = styled.div`
    display: flex;
`

const Item = styled.div`
    padding: 10px;
`
const RemoveButton = styled.div`
    padding: 15px;
    cursor: pointer;
`
