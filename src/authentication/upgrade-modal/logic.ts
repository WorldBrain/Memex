import { checkStripePlan } from 'src/util/subscriptions/storage'
import {
    PromptTemplatesEvent,
    PromptTemplatesDependencies,
    PromptTemplatesState,
} from './types'
import { UIEventHandler, UILogic } from 'ui-logic-core'
import { PremiumPlans } from '@worldbrain/memex-common/lib/subscriptions/availablePowerups'

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
        this.emitMutation({
            checkoutLoading: { $set: 'running' },
        })

        let currentlySelected: PremiumPlans[] = Object.keys(
            previousState.activatedPowerUps,
        ).filter((key) => previousState.activatedPowerUps[key] === true)
        const doNotOpen = currentlySelected.length > 0

        let newSelection: PremiumPlans[] = currentlySelected

        if (event === 'AIpowerupBasic') {
            newSelection = newSelection.filter(
                (key) => key !== 'AIpowerup' && key !== 'AIpowerupOwnKey',
            )
        } else if (event === 'bookmarksPowerUpBasic') {
            newSelection = newSelection.filter(
                (key) => key !== 'bookmarksPowerUp',
            )
        } else {
            newSelection.push(event)
        }

        console.log('newSelection', newSelection)
        const upgradeResponse = await this.dependencies.createCheckOutLink(
            previousState.billingPeriod,
            newSelection,
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
