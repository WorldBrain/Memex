import {
    RemoteFunctionRole,
    RemotePositionalFunction,
} from 'src/util/webextensionRPC'
import { BackupTimes } from '../types'

export interface BackupInterface<Role extends RemoteFunctionRole> {
    isAutomaticBackupEnabled: RemotePositionalFunction<Role, [], boolean>
    isAutomaticBackupAllowed: RemotePositionalFunction<Role, [], boolean>
    disableAutomaticBackup: RemotePositionalFunction<Role, [], void>
    enableAutomaticBackup: RemotePositionalFunction<Role, [], void>
    getBackupTimes: RemotePositionalFunction<Role, [], BackupTimes>
    startBackup: RemotePositionalFunction<Role, [], void>
}
