import React from 'react'
import ActionButton from '../../../../notifications/components/ActionButton'
import classNames from 'classnames'
import { BackupUIState } from 'src/backup-restore/ui/backup-status-bar/BackupStatusBarContainer'
import StatusOverlay from 'src/backup-restore/ui/backup-status-bar/components/StatusOverlay'
import { BackupTimes } from 'src/backup-restore/types'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'

const styles = require('./StatusBar.css')

interface Props {
    backupTimes: BackupTimes
    hover: boolean
    onMouseEnter: any
    onMouseLeave: any
    backupUIState: BackupUIState
    isAutomaticBackupAllowed: boolean
    isAutomaticBackupEnabled: boolean
    onAutomaticBackupSelect: (val: boolean) => void
    paymentUrl: string
}

const StatusBar = (props: Props) => {
    const backupProps = {
        isAutomaticBackupAllowed: props.isAutomaticBackupAllowed,
        isAutomaticBackupEnabled: props.isAutomaticBackupEnabled,
        onAutomaticBackupSelect: props.onAutomaticBackupSelect,
        message: props.backupUIState.message,
        header: props.backupUIState.header,
        UIstate: props.backupUIState.state,
        lastBackup: props.backupTimes.lastBackup as BackupTimes['lastBackup'],
        nextBackup: props.backupTimes.nextBackup as BackupTimes['nextBackup'],
    }

    return (
        <div className={styles.TopContainer}>
            <div
                className={styles.container}
                onMouseEnter={props.onMouseEnter}
                onMouseLeave={props.onMouseLeave}
            >
                <div className={styles.headerBox}>
                    <div className={styles.header}>Sync Status</div>
                    <div className={styles.IconBox}>
                        {props.backupUIState.state === 'success' ? (
                            <span
                                className={classNames(
                                    styles.successIcon,
                                    styles.icon,
                                )}
                            />
                        ) : (
                            <span
                                className={classNames(
                                    styles.failIcon,
                                    styles.icon,
                                )}
                            />
                        )}
                    </div>
                </div>
                <div className={styles.backupOverlay}>
                    {props.hover && props.backupTimes && (
                        <div>
                            {props.backupUIState.state === 'success' && (
                                <StatusOverlay
                                    {...backupProps}
                                    crossIcon={'img/cross.svg'}
                                >
                                    <PrimaryAction
                                        onClick={() =>
                                            (window.location.href =
                                                '/options.html#/backup')
                                        }
                                        label={` Backup  `}
                                    />
                                </StatusOverlay>
                            )}
                            {props.backupUIState.state === 'fail' && (
                                <StatusOverlay
                                    {...backupProps}
                                    crossIcon={'img/cross.svg'}
                                >
                                    <PrimaryAction
                                        onClick={() =>
                                            (window.location.href =
                                                '/options.html#/backup')
                                        }
                                        label={`Backup Now`}
                                    />
                                </StatusOverlay>
                            )}
                            {props.backupUIState.state === 'autoBackup' && (
                                <StatusOverlay
                                    {...backupProps}
                                    crossIcon={'img/cross.svg'}
                                    message={`Automatically backup your data every 15 minutes.`}
                                >
                                    <PrimaryAction
                                        onClick={() =>
                                            (window.location.href =
                                                props.paymentUrl)
                                        }
                                        label={`Upgrade Now`}
                                    />
                                </StatusOverlay>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default StatusBar
