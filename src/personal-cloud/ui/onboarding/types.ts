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
}

export interface State {
    loadState: UITaskState
    currentUser: AuthenticatedUser | null
    tier2PaymentPeriod: PaymentPeriod
}

export interface Event {
    setTier2PaymentPeriod: { period: PaymentPeriod }
    selectPlan: { tier: PlanTier }
}
