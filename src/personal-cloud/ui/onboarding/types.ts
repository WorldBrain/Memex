import type { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'

import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type { BackupInterface } from 'src/backup-restore/background/types'
import type { PersonalCloudRemoteInterface } from 'src/personal-cloud/background/types'

export interface Dependencies {
    personalCloudBG: PersonalCloudRemoteInterface
    authBG: AuthRemoteFunctionsInterface
    backupBG: BackupInterface<'caller'>
    onModalClose: (args?: { didFinish?: boolean }) => void
}

export interface State {
    loadState: UITaskState
    dumpState: UITaskState
    migrationState: UITaskState
    dataCleaningState: UITaskState

    stage: 'data-dump' | 'data-clean' | 'data-migration' | 'old-version-backup'
    currentUser: AuthenticatedUser | null

    dumpPercentComplete: number
    isMigrationPrepped: boolean
    shouldBackupViaDump: boolean
    needsToRemovePassiveData: boolean
}

export interface Event {
    goToBackupRoute: null
    migrateToOldVersion: null
    cancelMigrateToOldVersion: null

    startDataDump: null
    retryDataDump: null
    cancelDataDump: null

    startDataClean: null
    retryDataClean: null
    cancelDataClean: null

    closeMigration: null
    retryMigration: null
    cancelMigration: null

    continueToMigration: null
}
