import type { UITaskState } from '../../../external/@worldbrain/memex-common/ts/main-ui/types'
import type {
    UIEvent,
    UISignal,
} from '../../../external/@worldbrain/memex-common/ts/main-ui/classes/logic'
import type { PremiumPlans } from '../../../external/@worldbrain/memex-common/ts/subscriptions/availablePowerups'
import type { AuthRemoteFunctionsInterface } from '../background/types'
import type { Browser } from 'webextension-polyfill'
import type { RemoteBGScriptInterface } from 'src/background-script/types'

export interface PromptTemplatesDependencies {
    powerUpType: PowerUpModalVersion
    limitReachedNotif?: PowerUpModalVersion
    createCheckOutLink: RemoteBGScriptInterface<'caller'>['createCheckoutLink']
    componentVariant: 'Modal' | 'PricingList' | 'AccountPage' | 'OnboardingStep'
    getRootElement?: () => HTMLElement
    closeComponent?: () => void
    authBG: AuthRemoteFunctionsInterface
    browserAPIs: Browser
}

export interface PromptTemplatesState {
    billingPeriod: 'monthly' | 'yearly'
    checkoutLoading: UITaskState
    componentVariant: 'Modal' | 'PricingList' | 'AccountPage' | 'OnboardingStep'
    powerUpType: PowerUpModalVersion
    activatedPowerUps?: Record<PremiumPlans, any>
    confirmPowerups?: PremiumPlans
    authLoadState: UITaskState
    userEmail?: string
}

export type PromptTemplatesEvent = UIEvent<{
    changeModalType: PowerUpModalVersion
    processCheckoutOpen: { plan: PremiumPlans }
    toggleBillingPeriod: 'monthly' | 'yearly'
    setPowerUpConfirmation: { selected?: PremiumPlans }
}>

export type PowerUpModalVersion = 'Bookmarks' | 'AI' | 'AIownKey' | 'lifetime'

export type PromptTemplatesSignal = UISignal<{ type: 'nothing-yet' }>
