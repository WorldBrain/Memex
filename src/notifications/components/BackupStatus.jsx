import React from 'react'
import PropTypes from 'prop-types'
// import BackupOverlay from 'src/common-ui/components/BackupOverlay'
import { BackupSuccess, BackupFailed, AutomaticBackup } from './BackupOverlay'

const styles = require('./BackupStatus.css')

const BackupStatus = props => {
    return (
        <div>
            <div
                className={styles.container}
                onMouseEnter={props.onMouseEnter}
                onMouseLeave={props.onMouseLeave}
            >
                <div className={styles.header}>Backup Status</div>
                <div>
                    {props.hasInitBackup ? (
                        <img src={props.checkedIcon} className={styles.icon} />
                    ) : (
                        <img src={props.crossIcon} className={styles.icon} />
                    )}
                </div>
                <div className={[styles.backupOverlay]}>
                    {props.hover && (
                        <div>
                            {props.backupState.state === 'success' && (
                                <BackupSuccess
                                    lastBackup={props.backupTimes.lastBackup}
                                    nextBackup={props.backupTimes.nextBackup}
                                    buttonUrl={'/options.html#/backup'}
                                    buttonText={'Backup Now'}
                                />
                            )}
                            {props.backupState.state === 'fail' && (
                                <BackupFailed
                                    lastBackup={props.backupTimes.lastBackup}
                                    buttonUrl={'/options.html#/backup'}
                                    buttonText={'Backup Now'}
                                    crossIcon={props.crossIcon}
                                />
                            )}
                            {props.backupState.state === 'autoBackup' && (
                                <AutomaticBackup />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

{
    /* <BackupFailed
errorMessage={'There is an error. Please try again'}
nextBackup={'this is a string'}
lastBackup={'this is a string'}
crossIcon={props.crossIcon}
checkedIcon={props.checkedIcon}
buttonUrl={'/options.html#/backup'}
buttonText={'Backup Now'}
/> */
}

BackupStatus.propTypes = {
    hasInitBackup: PropTypes.bool,
    backupTimes: PropTypes.object,
    // backupLocation: PropTypes.object,
    hover: PropTypes.bool,
    checkedIcon: PropTypes.string,
    crossIcon: PropTypes.string,
    onMouseEnter: PropTypes.func,
    onMouseLeave: PropTypes.func,
    backupState: PropTypes.object,
    // automaticBackupEnabled: PropTypes.bool,
    // backupInfo: PropTypes.object,
    // backupUrl: PropTypes.string,
    // backupStatus: PropTypes.object,
}

export default BackupStatus
