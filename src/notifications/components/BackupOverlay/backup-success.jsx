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
            crossIcon={props.crossIcon}
            checkedIcon={props.checkedIcon}
            automaticBackup
            isAutomaticBackupEnabled={props.automaticBackup}
            onAutomaticBackupSelect={props.onAutomaticBackupSelect}
            // buttonUrl={props.buttonUrl}
            // buttonText={props.buttonText}
        >
            {props.children}
        </BackupOverlay>
    )
}

BackupSuccess.propTypes = {
    lastBackup: PropTypes.number.isRequired,
    nextBackup: PropTypes.number.isRequired,
    crossIcon: PropTypes.string.isRequired,
    checkedIcon: PropTypes.string.isRequired,
    automaticBackup: PropTypes.bool.isRequired,
    onAutomaticBackupSelect: PropTypes.func,
    message: PropTypes.string,
    header: PropTypes.string,
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
}

export default BackupSuccess
