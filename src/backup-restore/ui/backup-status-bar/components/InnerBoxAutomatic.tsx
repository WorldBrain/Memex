import React from 'react'
import PropTypes from 'prop-types'
import StatusOverlay from 'src/backup-restore/ui/backup-status-bar/components/StatusOverlay'

const InnerBoxAutomatic = (props: Props) => {
    return (
        <StatusOverlay
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
        </StatusOverlay>
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

export default InnerBoxAutomatic
