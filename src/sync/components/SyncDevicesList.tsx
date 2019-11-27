import React from 'react'
import { SyncDevice } from 'src/sync/components/types'
import SyncDeviceItem from 'src/sync/components/SyncDeviceItem'

interface Props {
    devices: SyncDevice[]
    handleRemoveDevice: any
}

export function SyncDevicesList(props: Props) {
    return (
        <div>
            {props.devices.map(device => (
                <SyncDeviceItem
                    device={device}
                    handleRemoveDevice={props.handleRemoveDevice}
                />
            ))}
        </div>
    )
}
