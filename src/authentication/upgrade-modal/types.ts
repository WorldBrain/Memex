import { UITaskState } from '../../../external/@worldbrain/memex-common/ts/main-ui/types'
import {
    UIEvent,
    UISignal,
} from '../../../external/@worldbrain/memex-common/ts/main-ui/classes/logic'
import {
    PowerupOptions,
    PremiumPlans,
} from '../../../external/@worldbrain/memex-common/ts/subscriptions/availablePowerups'
import { Browser } from 'webextension-polyfill'
import { AuthRemoteFunctionsInterface } from '../background/types'

export interface PromptTemplatesDependencies {
    powerUpType: PowerUpModalVersion
    limitReachedNotif: PowerUpModalVersion
    createCheckOutLink: (
        billingPeriod: 'monthly' | 'yearly',
        selectedPremiumPlans: PremiumPlans[],
        doNotOpen: boolean,
    ) => Promise<'error' | 'success'>
    componentVariant: 'Modal' | 'PricingList'
    getRootElement: () => HTMLElement
    closeComponent?: () => void
    browserAPIs: Browser
    authBG: AuthRemoteFunctionsInterface
}

export interface PromptTemplatesState {
    billingPeriod: 'monthly' | 'yearly'
    checkoutLoading: UITaskState
    componentVariant: 'Modal' | 'PricingList'
    powerUpType: PowerUpModalVersion
    activatedPowerUps?: Record<PremiumPlans, any>
    authLoadState: UITaskState
    userEmail?: string
}

export type PromptTemplatesEvent = UIEvent<{
    changeModalType: PowerUpModalVersion
    processCheckoutOpen: PremiumPlans
    toggleBillingPeriod: 'monthly' | 'yearly'
}>

export type PowerUpModalVersion = 'Bookmarks' | 'AI'

export type PromptTemplatesSignal = UISignal<{ type: 'nothing-yet' }>
