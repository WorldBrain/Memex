import React from 'react'
import BackupOverlay from 'src/common-ui/components/BackupOverlay'

const BackupBoxSuccess = (props: Props) => {
    return (
        <BackupOverlay
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
        </BackupOverlay>
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

export default BackupBoxSuccess
