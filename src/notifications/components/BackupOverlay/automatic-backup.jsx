import React from 'react'
import PropTypes from 'prop-types'
import BackupOverlay from 'src/common-ui/components/BackupOverlay'

const AutomaticBackup = props => {
    return (
        <BackupOverlay
            header={props.header}
            message={props.message}
            buttonText={props.buttonText}
            buttonUrl={props.buttonUrl}
            onAutomaticBackupSelect={props.onAutomaticBackupSelect}
            automaticBackup={props.automaticBackup}
            automaticBackupEnabled={props.automaticBackupEnabled}
            automaticBackupAllowed={props.automaticBackupAllowed}
        >
            {props.children}
        </BackupOverlay>
    )
}

AutomaticBackup.propTypes = {
    buttonUrl: PropTypes.string,
    buttonText: PropTypes.string,
    message: PropTypes.string,
    onAutomaticBackupSelect: PropTypes.func,
    automaticBackup: PropTypes.bool,
    automaticBackupAllowed: PropTypes.bool,
    automaticBackupEnabled: PropTypes.bool,
    header: PropTypes.string,
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
}

export default AutomaticBackup
