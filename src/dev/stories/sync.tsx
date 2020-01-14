import { SyncDevice } from 'src/sync/components/types'
import { storiesOf } from '@storybook/react'
import { SyncDevicesPane } from 'src/sync/components/device-list/SyncDevicesPane'
import React from 'react'
import { PairDeviceScreen } from 'src/sync/components/initial-sync/initial-sync-setup/steps/PairDeviceScreen'
import { SyncDeviceScreen } from 'src/sync/components/initial-sync/initial-sync-setup/steps/SyncDeviceScreen'
import InitialSyncSetup from 'src/sync/components/initial-sync/initial-sync-setup'
import _ from 'lodash'

const devices = [
    {
        deviceId: '123',
        productType: "Tom's Iphone",
        createdWhen: new Date(),
    },
    {
        deviceId: '1235',
        productType: 'Android Device',
        createdWhen: new Date(),
    },
] as SyncDevice[]

storiesOf('Sync', module)
    .add('DevicePane', () => (
        <SyncDevicesPane
            devices={devices}
            isDeviceSyncAllowed={true}
            isDeviceSyncEnabled={true}
            handleRemoveDevice={() => false}
            getInitialSyncMessage={async () => 'test'}
            waitForInitialSync={async () => {}}
            waitForInitialSyncConnected={async () => {}}
        />
    ))
    .add('Initial Sync - Modal', () => (
        <div>
            <InitialSyncSetup
                getInitialSyncMessage={() =>
                    new Promise(r => setTimeout(r, 1000, 'hello '.repeat(100)))
                }
                waitForInitialSyncConnected={() =>
                    new Promise(r => setTimeout(r, 3000, 1))
                }
                waitForInitialSync={() =>
                    new Promise(r => setTimeout(r, 4000, 1))
                }
            />
        </div>
    ))
    .add('Initial Sync - Intro', () => (
        <div>
            <SyncDeviceScreen stage={1} />
            <SyncDeviceScreen stage={1} progressPct={50} />
        </div>
    ))
    .add('Initial Sync - Pair Device', () => (
        <div>
            <PairDeviceScreen initialSyncMessage={undefined} />
            <PairDeviceScreen initialSyncMessage={'sdfg'} />
        </div>
    ))
    .add('Initial Sync - Sync Device', () => (
        <div>
            <SyncDeviceScreen stage={1} />
            <SyncDeviceScreen stage={1} progressPct={50} />
        </div>
    ))

    .add('Initial Sync - Success', () => (
        <div>
            <SyncDeviceScreen stage={1} />
            <SyncDeviceScreen stage={1} progressPct={50} />
        </div>
    ))
