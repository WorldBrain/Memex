import { BackupTimes } from '../types'

export interface BackupInterface {
    isAutomaticBackupEnabled(): Promise<boolean>
    isAutomaticBackupAllowed(): Promise<boolean>
    getBackupTimes(): Promise<BackupTimes>
}
