import React from 'react'
import PropTypes from 'prop-types'
import BackupOverlay from 'src/common-ui/components/BackupOverlay'

const BackupFailed = props => {
    return (
        <BackupOverlay
            errorMessage={props.errorMessage}
            lastBackup={props.lastBackup}
            nextBackup={props.nextBackup ? props.nextBackup : null}
            crossIcon={props.crossIcon}
            buttonText={props.buttonText}
            automaticBackup
        />
    )
}

BackupFailed.propTypes = {
    errorMessage: PropTypes.string.isRequired,
    lastBackup: PropTypes.string.isRequired,
    nextBackup: PropTypes.string,
    crossIcon: PropTypes.string.isRequired,
    buttonText: PropTypes.string.isRequired,
}

export default BackupFailed
