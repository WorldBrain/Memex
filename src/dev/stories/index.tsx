import 'babel-polyfill'
import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, text, boolean, number } from '@storybook/addon-knobs'

import QRCanvas from 'src/common-ui/components/qr-canvas'
import ProgressStepContainer from 'src/common-ui/components/progress-step-container'
import OnboardingTooltip from 'src/overview/onboarding/components/onboarding-tooltip'
import { SyncDevicesPane } from 'src/sync/components/SyncDevicesPane'
import { SyncDevice } from 'src/sync/components/types'
import { calcBackupUIState } from 'src/backup-restore/ui/backup-status-bar/BackupStatusBarContainer'
import StatusBar from 'src/backup-restore/ui/backup-status-bar/components/StatusBar'
import { LocalStorageTypes } from 'src/util/storage'

storiesOf('ProgressContainer', module)
    .add('No steps seen/completed', () => (
        <ProgressStepContainer totalSteps={4} onStepClick={() => undefined} />
    ))
    .add('All steps seen', () => (
        <ProgressStepContainer
            totalSteps={4}
            currentStep={4}
            onStepClick={() => undefined}
        />
    ))

storiesOf('Onboarding Tooltip', module).add('Import example', () => (
    <OnboardingTooltip
        descriptionText="Import your existing bookmarks &amp; web history from Pocket, Diigo, Raindrop.io and many more."
        CTAText="Import"
        onCTAClick={() => undefined}
        onDismiss={() => undefined}
    />
))

const longText = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Dolor sed viverra ipsum nunc aliquet bibendum enim. In massa tempor nec feugiat.
Nunc aliquet bibendum enim facilisis gravida. Nisl nunc mi ipsum faucibus vitae aliquet nec ullamcorper.
Amet luctus venenatis lectus magna fringilla. Volutpat maecenas volutpat blandit aliquam etiam erat velit scelerisque in.
Egestas egestas fringilla phasellus faucibus scelerisque eleifend. Sagittis orci a scelerisque purus semper eget duis.
Nulla pharetra diam sit amet nisl suscipit. Sed adipiscing diam donec adipiscing tristique risus nec feugiat in. '
Fusce ut placerat orci nulla. Pharetra vel turpis nunc eget lorem dolor. Tristique senectus et netus et malesuada.
`

storiesOf('QR Code creation', module)
    .add('HTML canvas short example', () => <QRCanvas toEncode="test" />)
    .add('HTML canvas long example', () => <QRCanvas toEncode={longText} />)

const devices = [
    {
        id: '123',
        name: "Tom's Iphone",
        added: new Date(),
        initialSync: false,
        lastSync: null,
    },
    {
        id: '1235',
        name: 'Android Device',
        added: new Date(),
        initialSync: false,
        lastSync: null,
    },
] as SyncDevice[]

storiesOf('Device Sync', module).add('Sync DevicePane', () => (
    <SyncDevicesPane
        devices={devices}
        isDeviceSyncAllowed={true}
        isDeviceSyncEnabled={true}
        handleRemoveDevice={() => false}
        getInitialSyncMessage={async () => 'test'}
        waitForInitialSync={async () => {}}
    />
))

const propDefaultsBackupStatus = {
    isAutomaticBackupAllowed: true,
    isAutomaticBackupEnabled: true,
    backupTimes: {
        lastBackup: Date.now() - 1000,
        nextBackup: Date.now() + 1000,
    },
    hover: true,
    onAutomaticBackupSelect: () => false,
    onMouseEnter: () => false,
    onMouseLeave: () => false,
    paymentUrl: '',
}

const backupStatus = {
    state: 'no_backup',
    backupId: 'no_backup',
} as LocalStorageTypes['backup-status']

storiesOf('Backup Modules - Overlay', module)
    .add('Status - no backupTimes (no automatic backups)', () => (
        <StatusBar
            {...propDefaultsBackupStatus}
            backupTimes={{ lastBackup: null, nextBackup: null }}
            isAutomaticBackupAllowed={false}
            isAutomaticBackupEnabled={false}
            backupUIState={calcBackupUIState({
                showAutomaticBackupSubscription: false,
                backupStatus,
                isAutomaticBackupAllowed: false,
                isAutomaticBackupEnabled: false,
            })}
            hover={true}
        />
    ))
    .add('Status - lastBackup: Never (no automatic backups)', () => (
        <StatusBar
            {...propDefaultsBackupStatus}
            backupTimes={{ lastBackup: 'Never', nextBackup: null }}
            isAutomaticBackupAllowed={false}
            isAutomaticBackupEnabled={false}
            backupUIState={calcBackupUIState({
                showAutomaticBackupSubscription: false,
                backupStatus,
                isAutomaticBackupAllowed: false,
                isAutomaticBackupEnabled: false,
            })}
            hover={true}
        />
    ))
    .add('Status - lastBackup: Running (no automatic backups)', () => (
        <StatusBar
            {...propDefaultsBackupStatus}
            backupTimes={{ lastBackup: 'running', nextBackup: null }}
            isAutomaticBackupAllowed={false}
            isAutomaticBackupEnabled={false}
            backupUIState={calcBackupUIState({
                showAutomaticBackupSubscription: false,
                backupStatus,
                isAutomaticBackupAllowed: false,
                isAutomaticBackupEnabled: false,
            })}
            hover={true}
        />
    ))
    .add('Status - lastBackup: past (no automatic backups)', () => (
        <StatusBar
            {...propDefaultsBackupStatus}
            backupTimes={{ lastBackup: Date.now() - 10000, nextBackup: null }}
            isAutomaticBackupAllowed={false}
            isAutomaticBackupEnabled={false}
            backupUIState={calcBackupUIState({
                showAutomaticBackupSubscription: false,
                backupStatus,
                isAutomaticBackupAllowed: false,
                isAutomaticBackupEnabled: false,
            })}
            hover={true}
        />
    ))
    .add(
        'Status - lastBackup: past, nextBackup:soon (allowed automatic backups)',
        () => (
            <StatusBar
                {...propDefaultsBackupStatus}
                backupTimes={{
                    lastBackup: Date.now() - 10000,
                    nextBackup: null,
                }}
                isAutomaticBackupAllowed={true}
                isAutomaticBackupEnabled={false}
                backupUIState={calcBackupUIState({
                    showAutomaticBackupSubscription: false,
                    backupStatus,
                    isAutomaticBackupAllowed: true,
                    isAutomaticBackupEnabled: false,
                })}
                hover={true}
            />
        ),
    )
    .add(
        'Status - lastBackup: past, nextBackup:soon (allowed&enabled automatic backups)',
        () => (
            <StatusBar
                {...propDefaultsBackupStatus}
                backupTimes={{
                    lastBackup: Date.now() - 10000,
                    nextBackup: Date.now() + 10000,
                }}
                isAutomaticBackupAllowed={true}
                isAutomaticBackupEnabled={true}
                backupUIState={calcBackupUIState({
                    showAutomaticBackupSubscription: false,
                    backupStatus,
                    isAutomaticBackupAllowed: true,
                    isAutomaticBackupEnabled: true,
                })}
                hover={true}
            />
        ),
    )
    .add('Status - status: success (allowed&enabled automatic backups)', () => (
        <StatusBar
            {...propDefaultsBackupStatus}
            backupTimes={{
                lastBackup: Date.now() - 10000,
                nextBackup: Date.now() + 10000,
            }}
            isAutomaticBackupAllowed={true}
            isAutomaticBackupEnabled={true}
            backupUIState={calcBackupUIState({
                showAutomaticBackupSubscription: false,
                backupStatus: {
                    backupId: 'success',
                    state: 'success',
                },
                isAutomaticBackupAllowed: true,
                isAutomaticBackupEnabled: true,
            })}
            hover={true}
        />
    ))
    .add(
        'Status - status: auto_backup_expired (allowed&enabled automatic backups)',
        () => (
            <StatusBar
                {...propDefaultsBackupStatus}
                backupTimes={{
                    lastBackup: Date.now() - 10000,
                    nextBackup: Date.now() + 10000,
                }}
                isAutomaticBackupAllowed={true}
                isAutomaticBackupEnabled={true}
                backupUIState={calcBackupUIState({
                    showAutomaticBackupSubscription: false,
                    backupStatus: {
                        backupId: 'auto_backup_expired',
                        state: 'fail',
                    },
                    isAutomaticBackupAllowed: true,
                    isAutomaticBackupEnabled: true,
                })}
                hover={true}
            />
        ),
    )
    .add(
        'Status - status: backup_error (allowed&enabled automatic backups)',
        () => (
            <StatusBar
                {...propDefaultsBackupStatus}
                backupTimes={{
                    lastBackup: Date.now() - 10000,
                    nextBackup: Date.now() + 10000,
                }}
                isAutomaticBackupAllowed={true}
                isAutomaticBackupEnabled={true}
                backupUIState={calcBackupUIState({
                    showAutomaticBackupSubscription: false,
                    backupStatus: {
                        backupId: 'backup_error',
                        state: 'fail',
                    },
                    isAutomaticBackupAllowed: true,
                    isAutomaticBackupEnabled: true,
                })}
                hover={true}
            />
        ),
    )
    .add(
        'Status - status: fail drive_size_empty (allowed&enabled automatic backups)',
        () => (
            <StatusBar
                {...propDefaultsBackupStatus}
                backupTimes={{
                    lastBackup: Date.now() - 10000,
                    nextBackup: Date.now() + 10000,
                }}
                isAutomaticBackupAllowed={true}
                isAutomaticBackupEnabled={true}
                backupUIState={calcBackupUIState({
                    showAutomaticBackupSubscription: false,
                    backupStatus: {
                        backupId: 'drive_size_empty',
                        state: 'fail',
                    },
                    isAutomaticBackupAllowed: true,
                    isAutomaticBackupEnabled: true,
                })}
                hover={true}
            />
        ),
    )
    .add('Status - status: showAutomaticBackupSubscription', () => (
        <StatusBar
            {...propDefaultsBackupStatus}
            backupTimes={{
                lastBackup: Date.now() - 100000,
                nextBackup: null,
            }}
            isAutomaticBackupAllowed={false}
            isAutomaticBackupEnabled={false}
            backupUIState={calcBackupUIState({
                showAutomaticBackupSubscription: true,
                backupStatus: {
                    backupId: 'success',
                    state: 'success',
                },
                isAutomaticBackupAllowed: false,
                isAutomaticBackupEnabled: false,
            })}
            hover={true}
        />
    ))
    .add(
        'Status - status: fail&success?? (allowed&enabled automatic backups)',
        () => (
            <StatusBar
                {...propDefaultsBackupStatus}
                backupTimes={{
                    lastBackup: Date.now() - 10000,
                    nextBackup: Date.now() + 10000,
                }}
                isAutomaticBackupAllowed={true}
                isAutomaticBackupEnabled={true}
                backupUIState={calcBackupUIState({
                    showAutomaticBackupSubscription: false,
                    backupStatus: {
                        backupId: 'success',
                        state: 'fail',
                    },
                    isAutomaticBackupAllowed: true,
                    isAutomaticBackupEnabled: true,
                })}
                hover={true}
            />
        ),
    )
