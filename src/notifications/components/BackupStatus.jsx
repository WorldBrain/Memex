import React from 'react'
import PropTypes from 'prop-types'
import BackupOverlay from 'src/common-ui/components/BackupOverlay'

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
                        <BackupOverlay
                            rootEl="div.container"
                            hasInitBackup={props.hasInitBackup}
                            backupTimes={props.backupTimes}
                            backupLocation={props.backupLocation}
                            crossIcon={props.crossIcon}
                            checkedIcon={props.checkedIcon}
                            automaticBackupEnabled={
                                props.automaticBackupEnabled
                            }
                            backupInfo={props.backupInfo}
                            backupUrl={props.backupUrl}
                            backupStatus={props.backupStatus}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

BackupStatus.propTypes = {
    hasInitBackup: PropTypes.bool,
    backupTimes: PropTypes.object,
    backupLocation: PropTypes.object,
    hover: PropTypes.bool,
    checkedIcon: PropTypes.string,
    crossIcon: PropTypes.string,
    onMouseEnter: PropTypes.func,
    onMouseLeave: PropTypes.func,
    automaticBackupEnabled: PropTypes.bool,
    backupInfo: PropTypes.object,
    backupUrl: PropTypes.string,
    backupStatus: PropTypes.object,
}

export default BackupStatus
