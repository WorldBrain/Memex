import type { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'

import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type { UIServices } from 'src/services/ui/types'
import type { PaymentPeriod } from '../types'

export enum PlanTier {
    Explorer = 1,
    Thinker,
    Supporter,
}

export interface Dependencies {
    services: Pick<UIServices, 'overlay' | 'device' | 'logicRegistry'>
    authBG: AuthRemoteFunctionsInterface
    onModalClose: () => void
}

export interface State {
    loadState: UITaskState
    backupState: UITaskState
    migrationState: UITaskState
    dataCleaningState: UITaskState

    stage: 'data-dump' | 'data-clean' | 'data-migration' | 'old-version-backup'
    currentUser: AuthenticatedUser | null
    tier2PaymentPeriod: PaymentPeriod

    shouldBackupViaDump: boolean
    needsToRemovePassiveData: boolean
}

export interface Event {
    setTier2PaymentPeriod: { period: PaymentPeriod }
    selectPlan: { tier: PlanTier }

    migrateToOldVersion: null
    cancelMigrateToOldVersion: null
    goToBackupRoute: null

    startDataDump: null
    retryDataDump: null
    cancelDataDump: null

    startDataClean: null
    retryDataClean: null
    cancelDataClean: null

    retryDataMigration: null
    cancelDataMigration: null

    finishMigration: null
    continueToMigration: null
}
