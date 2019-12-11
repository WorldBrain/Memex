import React from 'react'
import PropTypes from 'prop-types'
import BackupOverlay from 'src/common-ui/components/BackupOverlay'

const BackupFailed = props => {
    return (
        <BackupOverlay
            header={props.header}
            errorMessage={props.errorMessage}
            lastBackup={props.lastBackup ? props.lastBackup : 'Never'}
            nextBackup={props.nextBackup ? props.nextBackup : null}
            crossIcon={props.crossIcon}
            automaticBackup={props.automaticBackup}
            automaticBackupEnabled={props.automaticBackupEnabled}
            automaticBackupAllowed={props.automaticBackupAllowed}
            onAutomaticBackupSelect={props.onAutomaticBackupSelect}
        >
            {props.children}
        </BackupOverlay>
    )
}

BackupFailed.propTypes = {
    errorMessage: PropTypes.string.isRequired,
    header: PropTypes.string.isRequired,
    lastBackup: PropTypes.number,
    nextBackup: PropTypes.number,
    crossIcon: PropTypes.string.isRequired,
    automaticBackup: PropTypes.bool.isRequired,
    automaticBackupAllowed: PropTypes.bool,
    automaticBackupEnabled: PropTypes.bool,
    onAutomaticBackupSelect: PropTypes.func.isRequired,
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
}

export default BackupFailed
