import React, { Component } from 'react'
import { SyncDevice } from 'src/sync/components/types'
import styled from 'styled-components'
import { formatTime } from 'src/util/time'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import {
    colorDisabled,
    colorPrimary,
    colorError,
} from 'src/common-ui/components/design-library/colors'

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
                <Item>
                    {device.devicePlatform} (Device-ID: {device.deviceId})
                </Item>
                <MiddleItem>
                    Time Added: {formatTime(device.createdWhen, true)}
                </MiddleItem>
                <RemoveButton onClick={this.handleRemoveDevice}>
                    Remove
                </RemoveButton>
            </DeviceRow>
        )
    }
}

const DeviceRow = styled.div`
    display: flex;
    align-items: center;
    width: auto;
`

const Item = styled.div`
    flex: 1;
    padding: 10px;
    text-transform: uppercase;
    font-weight: 600;
    text-align: left;
`
const MiddleItem = styled.div`
    padding: 10px;
    flex: 3;
`

const RemoveButton = styled.div`
    cursor: pointer;
    padding: 5px 10px;
    background: ${(props) => (props.disabled ? colorDisabled : colorError)};
    border-radius: 5px;
    cursor: pointer;
    display: inline-block;
    height: fit-content;
`
