import type {
    RemoteFunctionRole,
    RemotePositionalFunction,
} from 'src/util/webextensionRPC'
import type { BackupTimes } from '../types'

export interface BackupInterface<Role extends RemoteFunctionRole> {
    isAutomaticBackupEnabled: RemotePositionalFunction<Role, [], boolean>
    isAutomaticBackupAllowed: RemotePositionalFunction<Role, [], boolean>
    disableAutomaticBackup: RemotePositionalFunction<Role, [], void>
    enableAutomaticBackup: RemotePositionalFunction<Role, [], void>
    disableRecordingChanges: RemotePositionalFunction<Role, [], void>
    getBackupTimes: RemotePositionalFunction<Role, [], BackupTimes>
    startBackup: RemotePositionalFunction<Role, [], void>
}

export interface LocalBackupSettings {
    saveBlobs: any
    lastBackup: string
    accessTokenExpiry: Date
    lastBackupFinished: string
    lastProblemNotifShown: Date
    backupStatus: 'success' | 'fail' | 'no_backup'
    backupStatusId:
        | 'backup_error'
        | 'drive_size_empty'
        | 'auto_backup_expired'
        | 'success'
        | 'no_backup'

    accessToken: string
    refreshToken: string
    backendLocation: string

    isOnboarding: boolean
    runningBackup: boolean
    runningRestore: boolean
    hasInitialBackup: boolean
    driveAuthenticated: boolean
    progressSuccessful: boolean
    backupIsAuthenticating: boolean
    restoreIsAuthenticating: boolean
    automaticBackupsEnabled: boolean
}
