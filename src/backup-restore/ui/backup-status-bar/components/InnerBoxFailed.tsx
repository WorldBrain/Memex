import React from 'react'
import StatusOverlay from 'src/backup-restore/ui/backup-status-bar/components/StatusOverlay'

const InnerBoxFailed = (props: Props) => {
    return (
        <StatusOverlay
            header={props.header}
            errorMessage={props.errorMessage}
            lastBackup={props.lastBackup ? props.lastBackup : 'Never'}
            nextBackup={props.nextBackup ? props.nextBackup : null}
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
    errorMessage: string
    header: string
    lastBackup: number
    nextBackup: number
    isAutomaticBackupEnabled: boolean
    isAutomaticBackupAllowed: boolean
    onAutomaticBackupSelect: (val: boolean) => void
    children: any
}

export default InnerBoxFailed
