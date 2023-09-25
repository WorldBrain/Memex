export type LastBackup = 'Never' | 'running' | number | null
export type NextBackup = number | null

export interface BackupTimes {
    lastBackup: LastBackup
    nextBackup: NextBackup
}

export type BackupLocation = 'google-drive' | 'local'

export interface BackupStatusType {
    state: 'no_backup' | 'success' | 'fail'
    backupId:
        | 'no_backup'
        | 'success'
        | 'backup_error'
        | 'drive_size_empty'
        | 'auto_backup_expired'
}
