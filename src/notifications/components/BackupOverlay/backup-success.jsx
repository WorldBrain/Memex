import React from 'react'
import PropTypes from 'prop-types'
import BackupOverlay from 'src/common-ui/components/BackupOverlay'

const BackupSuccess = props => {
    return (
        <BackupOverlay
            header={props.header}
            message={props.message}
            lastBackup={props.lastBackup ? props.lastBackup : 'Never'}
            nextBackup={props.nextBackup}
            automaticBackup={props.automaticBackup}
            automaticBackupEnabled={props.automaticBackupEnabled}
            automaticBackupAllowed={props.automaticBackupAllowed}
        >
            {props.children}
        </BackupOverlay>
    )
}

BackupSuccess.propTypes = {
    lastBackup: PropTypes.number.isRequired,
    nextBackup: PropTypes.number,
    automaticBackup: PropTypes.bool.isRequired,
    automaticBackupAllowed: PropTypes.bool,
    automaticBackupEnabled: PropTypes.bool,
    message: PropTypes.string.isRequired,
    header: PropTypes.string,
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
}

export default BackupSuccess
