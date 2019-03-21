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
            isAutomaticBackupEnabled={props.automaticBackup}
        >
            {props.children}
        </BackupOverlay>
    )
}

AutomaticBackup.propTypes = {
    buttonUrl: PropTypes.string.isRequired,
    buttonText: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    onAutomaticBackupSelect: PropTypes.func.isRequired,
    automaticBackup: PropTypes.bool.isRequired,
    header: PropTypes.string,
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
}

export default AutomaticBackup
