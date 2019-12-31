import React from 'react'
import ReactDOM from 'react-dom'
import { SyncDevice } from 'src/sync/components/types'
import SyncDeviceItem from 'src/sync/components/SyncDeviceItem'
const styles = require('./styles.css')

interface Props {
    devices: SyncDevice[]
    handleRemoveDevice: any
}

export function SyncDevicesList(props: Props) {
    return (
        <div>
            {props.devices.length === 0 ? (
                <p className={styles.noDevices}>
                    {' '}
                    You have not added any device
                </p>
            ) : (
                <span>
                    {props.devices.map(device => (
                        <SyncDeviceItem
                            device={device}
                            handleRemoveDevice={props.handleRemoveDevice}
                        />
                    ))}
                </span>
            )}
        </div>
    )
}
