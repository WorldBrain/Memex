import React from 'react'
import PropTypes from 'prop-types'
import BackupOverlay from 'src/backup/components/BackupOverlay/BackupOverlay'

const BackupBoxAutomatic = (props: Props) => {
    return (
        <BackupOverlay
            header={props.header}
            message={props.message}
            buttonText={props.buttonText}
            buttonUrl={props.buttonUrl}
            isAutomaticBackupEnabled={props.isAutomaticBackupEnabled}
            isAutomaticBackupAllowed={props.isAutomaticBackupAllowed}
            onAutomaticBackupSelect={props.onAutomaticBackupSelect}
            crossIcon={'/img/cross_grey.svg'}
        >
            {props.children}
        </BackupOverlay>
    )
}

interface Props {
    header?: string
    message?: string
    buttonUrl?: string
    buttonText?: string
    isAutomaticBackupEnabled: boolean
    isAutomaticBackupAllowed: boolean
    onAutomaticBackupSelect: (val: boolean) => void
    children: any
}

export default BackupBoxAutomatic
