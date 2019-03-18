import React from 'react'
import PropTypes from 'prop-types'
import BackupOverlay from 'src/common-ui/components/BackupOverlay'

const BackupSuccess = props => {
    return (
        <BackupOverlay
            header="Backup Successful"
            message={`Your last backup was successful. Click Backup Now if you want to backup again.`}
            lastBackup={props.lastBackup}
            nextBackup={props.nextBackup}
            crossIcon={props.crossIcon}
            checkedIcon={props.checkedIcon}
            automaticBackup
            buttonUrl={props.buttonUrl}
            buttonText={props.buttonText}
        />
    )
}

BackupSuccess.propTypes = {
    lastBackup: PropTypes.string.isRequired,
    nextBackup: PropTypes.string.isRequired,
    crossIcon: PropTypes.string.isRequired,
    checkedIcon: PropTypes.string.isRequired,
    buttonUrl: PropTypes.string.isRequired,
    buttonText: PropTypes.string.isRequired,
}

export default BackupSuccess
