import { checkStripePlan } from 'src/util/subscriptions/storage'
import {
    PromptTemplatesEvent,
    PromptTemplatesDependencies,
    PromptTemplatesState,
} from './types'
import { UIEventHandler, UILogic } from 'ui-logic-core'

type EventHandler<
    EventName extends keyof PromptTemplatesEvent
> = UIEventHandler<PromptTemplatesState, PromptTemplatesEvent, EventName>

export default class PromptTemplatesLogic extends UILogic<
    PromptTemplatesState,
    PromptTemplatesEvent
> {
    constructor(private dependencies: PromptTemplatesDependencies) {
        super()
    }

    init: EventHandler<'init'> = async () => {
        this.getInitialState()
        this.emitMutation({
            powerUpType: {
                $set:
                    this.dependencies.limitReachedNotif ||
                    this.dependencies.powerUpType,
            },
        })

        const userEmail = (await this.dependencies.authBG.getCurrentUser())
            ?.email
        const activatedPowerUps = await checkStripePlan(userEmail)
        console.log('activatedPowerUps', activatedPowerUps)

        this.emitMutation({
            activatedPowerUps: { $set: activatedPowerUps },
            userEmail: { $set: userEmail },
            authLoadState: { $set: 'success' },
        })
    }

    getInitialState(): PromptTemplatesState {
        const componentVariant = this.dependencies.componentVariant

        return {
            billingPeriod: 'monthly',
            checkoutLoading: 'pristine',
            componentVariant: componentVariant,
            powerUpType: null,
            activatedPowerUps: null,
            authLoadState: 'running',
            userEmail: null,
        }
    }

    changeModalType: EventHandler<'changeModalType'> = async ({ event }) => {
        this.emitMutation({
            powerUpType: { $set: event },
        })
    }

    processCheckoutOpen: EventHandler<'processCheckoutOpen'> = async ({
        event,
        previousState,
    }) => {
        const selectedPremiumPlan = event
        this.emitMutation({
            checkoutLoading: { $set: 'running' },
        })

        const doNotOpen = Object.values(previousState.activatedPowerUps).some(
            (value) => value === true,
        )

        const upgradeResponse = await this.dependencies.createCheckOutLink(
            previousState.billingPeriod,
            selectedPremiumPlan,
            doNotOpen,
        )

        if (upgradeResponse === 'error') {
            this.emitMutation({
                checkoutLoading: { $set: 'error' },
            })
            return
        } else if (upgradeResponse === 'success') {
            const updatedPlans = await checkStripePlan(previousState.userEmail)
            this.emitMutation({
                activatedPowerUps: { $set: updatedPlans },
                checkoutLoading: { $set: 'success' },
            })
        }
    }

    toggleBillingPeriod: EventHandler<'toggleBillingPeriod'> = async ({
        event,
    }) => {
        this.emitMutation({
            billingPeriod: { $set: event },
        })
    }
}
