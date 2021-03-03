import {
    RemoteFunctionRole,
    RemotePositionalFunction,
} from 'src/util/webextensionRPC'
import { BackupTimes } from '../types'

export interface BackupInterface<Role extends RemoteFunctionRole> {
    isAutomaticBackupEnabled: RemotePositionalFunction<Role, [], boolean>
    isAutomaticBackupAllowed: RemotePositionalFunction<Role, [], boolean>
    getBackupTimes: RemotePositionalFunction<Role, [], BackupTimes>
    startBackup: RemotePositionalFunction<Role, [], void>
}
