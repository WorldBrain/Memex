import React from 'react'
import StatusOverlay from 'src/backup-restore/ui/backup-status-bar/components/StatusOverlay'

const InnerBoxSuccess = (props: Props) => {
    return (
        <StatusOverlay
            header={props.header}
            message={props.message}
            lastBackup={props.lastBackup ? props.lastBackup : 'Never'}
            nextBackup={props.nextBackup}
            isAutomaticBackupEnabled={props.isAutomaticBackupEnabled}
            isAutomaticBackupAllowed={props.isAutomaticBackupAllowed}
            onAutomaticBackupSelect={props.onAutomaticBackupSelect}
            crossIcon={'/img/cross_blue.svg'}
        >
            {props.children}
        </StatusOverlay>
    )
}

interface Props {
    header?: string
    message?: string
    lastBackup: number
    nextBackup?: number
    isAutomaticBackupEnabled: boolean
    isAutomaticBackupAllowed: boolean
    onAutomaticBackupSelect: (val: boolean) => void
    children: any
}

export default InnerBoxSuccess
