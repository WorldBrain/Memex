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
            // buttonText={props.buttonText}
            // buttonUrl={props.buttonUrl}
            automaticBackup
            isAutomaticBackupEnabled={props.automaticBackup}
            onAutomaticBackupSelect={props.onAutomaticBackupSelect}
        >
            {props.children}
        </BackupOverlay>
    )
}

BackupFailed.propTypes = {
    errorMessage: PropTypes.string.isRequired,
    header: PropTypes.string.isRequired,
    lastBackup: PropTypes.number.isRequired,
    nextBackup: PropTypes.number,
    crossIcon: PropTypes.string.isRequired,
    automaticBackup: PropTypes.bool.isRequired,
    onAutomaticBackupSelect: PropTypes.func,
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
}

export default BackupFailed
