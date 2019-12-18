import React from 'react'
import BackupOverlay from 'src/backup/components/BackupOverlay/BackupOverlay'

const BackupBoxFailed = (props: Props) => {
    return (
        <BackupOverlay
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
        </BackupOverlay>
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

export default BackupBoxFailed
