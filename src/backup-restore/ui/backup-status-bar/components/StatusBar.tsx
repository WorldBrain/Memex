import React from 'react'
import ActionButton from '../../../../notifications/components/ActionButton'
import classNames from 'classnames'
import { BackupUIState } from 'src/backup-restore/ui/backup-status-bar/BackupStatusBarContainer'
import StatusOverlay from 'src/backup-restore/ui/backup-status-bar/components/StatusOverlay'
import { BackupTimes } from 'src/backup-restore/types'

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
                    <div className={styles.header}>Backup Status</div>
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
                                    <div className={styles.ActionButton}>
                                        <ActionButton
                                            handleClick={() =>
                                                (window.location.href =
                                                    '/options.html#/backup')
                                            }
                                        >
                                            {` Backup Now `}
                                        </ActionButton>
                                    </div>
                                </StatusOverlay>
                            )}
                            {props.backupUIState.state === 'fail' && (
                                <StatusOverlay
                                    {...backupProps}
                                    crossIcon={'img/cross.svg'}
                                >
                                    <div className={styles.ActionButton}>
                                        <ActionButton
                                            handleClick={() =>
                                                (window.location.href =
                                                    '/options.html#/backup')
                                            }
                                        >
                                            {` Backup Now `}
                                        </ActionButton>
                                    </div>
                                </StatusOverlay>
                            )}
                            {props.backupUIState.state === 'autoBackup' && (
                                <StatusOverlay
                                    {...backupProps}
                                    crossIcon={'img/cross.svg'}
                                    message={`Automatically backup your data every 15 minutes.`}
                                >
                                    <div className={styles.ActionButton}>
                                        <ActionButton
                                            handleClick={() =>
                                                (window.location.href =
                                                    props.paymentUrl)
                                            }
                                        >
                                            {` Upgrade Now `}
                                        </ActionButton>
                                    </div>
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
