import { LocalStorageTypes } from 'src/util/storage'
import { storiesOf } from '@storybook/react'
import StatusBar from 'src/backup-restore/ui/backup-status-bar/components/StatusBar'
import { calcBackupUIState } from 'src/backup-restore/ui/backup-status-bar/BackupStatusBarContainer'
import React from 'react'

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
