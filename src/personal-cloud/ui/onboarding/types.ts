import type { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'

import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type { BackupInterface } from 'src/backup-restore/background/types'
import type { PersonalCloudRemoteInterface } from 'src/personal-cloud/background/types'
import type { BrowserName } from 'src/util/check-browser'

export interface Dependencies {
    browser: BrowserName
    personalCloudBG: PersonalCloudRemoteInterface
    authBG: AuthRemoteFunctionsInterface
    backupBG: BackupInterface<'caller'>
    onModalClose: (args?: { didFinish?: boolean }) => void
}

export interface State {
    loadState: UITaskState
    migrationState: UITaskState
    dataCleaningState: UITaskState

    stage: 'data-dump' | 'data-clean' | 'data-migration' | 'old-version-backup'
    currentUser: AuthenticatedUser | null

    isMigrationPrepped: boolean
    giveControlToDumper: boolean
    shouldBackupViaDump: boolean
    needsToRemovePassiveData: boolean
}

export interface Event {
    goToBackupRoute: null
    attemptModalClose: null
    migrateToOldVersion: null
    cancelMigrateToOldVersion: null

    startDataDump: null
    cancelDataDump: null

    startDataClean: null
    retryDataClean: null
    cancelDataClean: null

    closeMigration: null
    retryMigration: null
    cancelMigration: null

    continueToMigration: null
}
