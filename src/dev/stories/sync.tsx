import { SyncDevice } from 'src/sync/components/types'
import { storiesOf } from '@storybook/react'
import { SyncDevicesPane } from 'src/sync/components/device-list/SyncDevicesPane'
import React from 'react'
import { PairDeviceScreen } from 'src/sync/components/initial-sync/initial-sync-setup/steps/PairDeviceScreen'
import { SyncDeviceScreen } from 'src/sync/components/initial-sync/initial-sync-setup/steps/SyncDeviceScreen'
import InitialSyncSetup from 'src/sync/components/initial-sync/initial-sync-setup'
import _ from 'lodash'
import TypedEventEmitter from 'typed-emitter'
import { InitialSyncEvents } from '@worldbrain/storex-sync/lib/integration/initial-sync'
import {
    FastSyncInfo,
    FastSyncRole,
} from '@worldbrain/storex-sync/lib/fast-sync/types'
import { Success } from 'src/sync/components/initial-sync/initial-sync-setup/steps/Success'
import { Introduction } from 'src/sync/components/initial-sync/initial-sync-setup/steps/Introduction'
import { EventEmitter } from 'events'
import Modal from 'src/common-ui/components/Modal'

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
    .add('DevicePane - Subscribed', () => (
        <SyncDevicesPane
            devices={devices}
            isDeviceSyncAllowed={true}
            isDeviceSyncEnabled={true}
            handleRemoveDevice={() => false}
            getInitialSyncMessage={async () => 'test'}
            waitForInitialSync={async () => {}}
            waitForInitialSyncConnected={async () => {}}
            refreshDevices={async () => {}}
            handleUpgradeNeeded={() => {}}
            abortInitialSync={async () => {}}
        />
    ))
    .add('DevicePane - Not Subscribed', () => (
        <SyncDevicesPane
            devices={devices}
            isDeviceSyncAllowed={false}
            isDeviceSyncEnabled={true}
            handleRemoveDevice={() => false}
            getInitialSyncMessage={async () => 'test'}
            waitForInitialSync={async () => {}}
            waitForInitialSyncConnected={async () => {}}
            refreshDevices={async () => {}}
            handleUpgradeNeeded={() => {}}
            abortInitialSync={async () => {}}
        />
    ))
    .add('Initial Sync - Modal', () => (
        <Modal large>
            <InitialSyncSetup
                open={true}
                getInitialSyncMessage={() =>
                    new Promise(r => setTimeout(r, 1000, 'hello '.repeat(5)))
                }
                waitForInitialSyncConnected={() =>
                    new Promise(r => setTimeout(r, 3000, 1))
                }
                waitForInitialSync={() =>
                    new Promise(r =>
                        setTimeout(r, 500 * progressStoryData.length, 1),
                    )
                }
                abortInitialSync={async () => {}}
                getSyncEventEmitter={() => {
                    const eventEmitter = new EventEmitter() as TypedEventEmitter<
                        InitialSyncEvents
                    >

                    const testEventSender = async () => {
                        await new Promise(r => setTimeout(r, 3000 + 100, 1))
                        for (const e of progressStoryData) {
                            await new Promise(r =>
                                setTimeout(
                                    r,
                                    500,
                                    eventEmitter.emit(
                                        e.eventName as keyof InitialSyncEvents,
                                        e,
                                    ),
                                ),
                            )
                        }
                    }
                    testEventSender()

                    return eventEmitter
                }}
            />
        </Modal>
    ))
    .add('Initial Sync - Intro', () => (
        <div>
            <Introduction handleBack={() => false} handleStart={() => false} />
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
            <SyncDeviceScreen stage={'1/2'} />
            <SyncDeviceScreen stage={'1/2'} progressPct={0.5} />
        </div>
    ))

    .add('Initial Sync - Error', () => (
        <div>
            <SyncDeviceScreen
                stage={'1/2'}
                progressPct={0.5}
                error={'An error with the flux capacitor occurred.'}
            />
        </div>
    ))
    .add('Initial Sync - Success', () => (
        <div>
            <Success onClose={() => false} />
        </div>
    ))

const expectedSyncInfoWhileReceiving: FastSyncInfo = {
    collectionCount: 1,
    objectCount: 5,
}
const expectedSyncInfoWhileSending: FastSyncInfo = {
    collectionCount: 1,
    objectCount: 3,
}
const createProgressStoryData = (
    initialRole: FastSyncRole,
    subsequentRole: FastSyncRole,
) => [
    // {
    //     eventName: 'prepared',
    //     role: initialRole,
    //     syncInfo: {
    //         ...expectedSyncInfoWhileReceiving,
    //     },
    // },
    {
        eventName: 'progress',
        role: initialRole,
        progress: {
            ...expectedSyncInfoWhileReceiving,
            totalObjectsProcessed: 0,
        },
    },
    {
        eventName: 'progress',
        role: initialRole,
        progress: {
            ...expectedSyncInfoWhileReceiving,
            totalObjectsProcessed: 1,
        },
    },
    {
        eventName: 'progress',
        role: initialRole,
        progress: {
            ...expectedSyncInfoWhileReceiving,
            totalObjectsProcessed: 2,
        },
    },
    {
        eventName: 'progress',
        role: initialRole,
        progress: {
            ...expectedSyncInfoWhileReceiving,
            totalObjectsProcessed: 3,
        },
    },
    {
        eventName: 'progress',
        role: initialRole,
        progress: {
            ...expectedSyncInfoWhileReceiving,
            totalObjectsProcessed: 4,
        },
    },
    {
        eventName: 'progress',
        role: initialRole,
        progress: {
            ...expectedSyncInfoWhileReceiving,
            totalObjectsProcessed: 5,
        },
    },
    {
        eventName: 'roleSwitch',
        before: initialRole,
        after: subsequentRole,
    },
    // {
    //     eventName: 'prepared',
    //     role: subsequentRole,
    //     syncInfo: {
    //         ...expectedSyncInfoWhileSending,
    //     },
    // },
    {
        eventName: 'progress',
        role: subsequentRole,
        progress: {
            ...expectedSyncInfoWhileSending,
            totalObjectsProcessed: 0,
        },
    },
    {
        eventName: 'progress',
        role: subsequentRole,
        progress: {
            ...expectedSyncInfoWhileSending,
            totalObjectsProcessed: 1,
        },
    },
    {
        eventName: 'progress',
        role: subsequentRole,
        progress: {
            ...expectedSyncInfoWhileSending,
            totalObjectsProcessed: 2,
        },
    },
    {
        eventName: 'progress',
        role: subsequentRole,
        progress: {
            ...expectedSyncInfoWhileSending,
            totalObjectsProcessed: 3,
        },
    },
]

const progressStoryData = createProgressStoryData('receiver', 'sender')
