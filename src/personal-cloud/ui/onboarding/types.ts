import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'

import type { BackupInterface } from 'src/backup-restore/background/types'
import type { PersonalCloudRemoteInterface } from 'src/personal-cloud/background/types'
import type { BrowserName } from 'src/util/check-browser'
import type { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'

export interface Dependencies {
    browser: BrowserName
    backupBG: BackupInterface<'caller'>
    syncSettingsBG: RemoteSyncSettingsInterface
    personalCloudBG: PersonalCloudRemoteInterface
    onModalClose: (args?: { didFinish?: boolean }) => void
}

export interface State {
    loadState: UITaskState
    migrationState: UITaskState
    dataCleaningState: UITaskState

    stage: 'data-dump' | 'data-clean' | 'data-migration' | 'old-version-backup'

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

    closeMigration: { now?: number }
    retryMigration: null
    cancelMigration: null

    continueToMigration: null
}
