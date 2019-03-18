import React from 'react'
import PropTypes from 'prop-types'
import BackupOverlay from 'src/common-ui/components/BackupOverlay'

const AutomaticBackup = props => {
    return (
        <BackupOverlay
            header="Automatic Backups are a premium feature"
            message={`Backup your data automatically every 15 minutes. Worry-free.`}
            automaticBackup
            buttonUrl={props.buttonUrl}
            buttonText={props.buttonText}
        />
    )
}

AutomaticBackup.propTypes = {
    buttonUrl: PropTypes.string,
    buttonText: PropTypes.string,
}

export default AutomaticBackup
