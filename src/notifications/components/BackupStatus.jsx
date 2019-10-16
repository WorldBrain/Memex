import React from 'react'
import PropTypes from 'prop-types'
import { BackupSuccess, BackupFailed, AutomaticBackup } from './BackupOverlay'
import ActionButton from './ActionButton'
import classNames from 'classnames'

const styles = require('./BackupStatus.css')

const BackupStatus = props => {
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
                        {props.backupState.state === 'success' ? (
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
                <div className={[styles.backupOverlay]}>
                    {props.hover &&
                        props.backupTimes && (
                            <div>
                                {props.backupState.state === 'success' && (
                                    <BackupSuccess
                                        message={props.backupState.message}
                                        header={props.backupState.header}
                                        lastBackup={
                                            props.backupTimes.lastBackup
                                        }
                                        nextBackup={
                                            props.backupTimes.nextBackup
                                        }
                                        automaticBackup={props.automaticBackup}
                                        onAutomaticBackupSelect={
                                            props.onAutomaticBackupSelect
                                        }
                                    >
                                        <div className={styles.ActionButton}>
                                            <ActionButton
                                                handleClick={() =>
                                                    (window.location.href =
                                                        '/options.html#/backup')
                                                }
                                                className={styles.ActionButton}
                                            >
                                                {' '}
                                                Backup Now{' '}
                                            </ActionButton>
                                        </div>
                                    </BackupSuccess>
                                )}
                                {props.backupState.state === 'fail' && (
                                    <BackupFailed
                                        errorMessage={props.backupState.message}
                                        header={props.backupState.header}
                                        lastBackup={
                                            props.backupTimes.lastBackup
                                        }
                                        nextBackup={
                                            props.backupTimes.nextBackup
                                        }
                                        crossIcon={props.crossIcon}
                                        automaticBackup={props.automaticBackup}
                                        onAutomaticBackupSelect={
                                            props.onAutomaticBackupSelect
                                        }
                                    >
                                        <div className={styles.ActionButton}>
                                            <ActionButton
                                                handleClick={() =>
                                                    (window.location.href =
                                                        '/options.html#/backup')
                                                }
                                                className={styles.ActionButton}
                                            >
                                                {' '}
                                                Backup Now{' '}
                                            </ActionButton>
                                        </div>
                                    </BackupFailed>
                                )}
                                {props.backupState.state === 'autoBackup' && (
                                    <AutomaticBackup
                                        header={props.backupState.header}
                                        onAutomaticBackupSelect={
                                            props.onAutomaticBackupSelect
                                        }
                                        automaticBackup={props.automaticBackup}
                                        message={`Automatic backups every 15 minutes. Worry-free.`}
                                    >
                                        <div className={styles.ActionButton}>
                                            <ActionButton
                                                handleClick={() =>
                                                    (window.location.href =
                                                        props.paymentUrl)
                                                }
                                                className={styles.ActionButton}
                                            >
                                                {' '}
                                                Upgrade now{' '}
                                            </ActionButton>
                                        </div>
                                    </AutomaticBackup>
                                )}
                            </div>
                        )}
                </div>
            </div>
        </div>
    )
}

BackupStatus.propTypes = {
    backupTimes: PropTypes.object,
    hover: PropTypes.bool,
    crossIcon: PropTypes.string,
    onMouseEnter: PropTypes.func,
    onMouseLeave: PropTypes.func,
    backupState: PropTypes.object,
    automaticBackup: PropTypes.bool,
    onAutomaticBackupSelect: PropTypes.func,
    paymentUrl: PropTypes.string,
}

export default BackupStatus
