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

    stage: 'pick-plan' | 'data-dump' | 'data-migration'
    currentUser: AuthenticatedUser | null
    tier2PaymentPeriod: PaymentPeriod
    needsToRemovePassiveData: boolean
}

export interface Event {
    setTier2PaymentPeriod: { period: PaymentPeriod }
    selectPlan: { tier: PlanTier }

    startDataDump: null
    retryDataDump: null
    cancelDataDump: null

    retryDataClean: null
    cancelDataClean: null

    retryDataMigration: null
    cancelDataMigration: null

    finishMigration: null
    continueToMigration: null
}
