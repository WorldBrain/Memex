import React from 'react'
import { SyncDevice } from 'src/sync/components/types'
import SyncDeviceItem from 'src/sync/components/device-list/SyncDeviceItem'

interface Props {
    devices: SyncDevice[]
    handleRemoveDevice: any
}

export function SyncDevicesList(props: Props) {
    return (
        <div>
            {props.devices.length === 0 ? null : (
                <span>
                    {props.devices.map(device => (
                        <SyncDeviceItem
                            key={`sync-device-${device.deviceId}`}
                            device={device}
                            handleRemoveDevice={props.handleRemoveDevice}
                        />
                    ))}
                </span>
            )}
        </div>
    )
}
