import { checkStripePlan } from '@worldbrain/memex-common/lib/subscriptions/storage'

import {
    PromptTemplatesEvent,
    PromptTemplatesDependencies,
    PromptTemplatesState,
} from './types'
import { UIEventHandler, UILogic } from 'ui-logic-core'
import { PremiumPlans } from '@worldbrain/memex-common/lib/subscriptions/availablePowerups'
import { enforceTrialPeriod } from '@worldbrain/memex-common/lib/subscriptions/storage'
import stateManagerTestData from 'src/imports/background/state-manager.test.data'
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

    getInitialState(): PromptTemplatesState {
        const componentVariant = this.dependencies.componentVariant

        return {
            remainingTrialDays: null,
            billingPeriod: 'monthly',
            checkoutLoading: 'pristine',
            componentVariant: componentVariant,
            powerUpType: null,
            activatedPowerUps: new Set(),
            selectedPowerUps: new Set(),
            authLoadState: 'running',
            userEmail: null,
            confirmPowerups: null,
        }
    }

    init: EventHandler<'init'> = async () => {
        this.emitMutation({
            authLoadState: { $set: 'running' },
        })

        console.log('deps', this.dependencies.powerUpType)
        this.getInitialState()
        this.emitMutation({
            powerUpType: {
                $set: this.dependencies.powerUpType,
            },
        })

        const currentUser = await this.dependencies.authBG.getCurrentUser()
        const userEmail = currentUser?.email
        const userSignupDate = new Date(currentUser.creationTime).getTime()

        const [activatedPowerUps, isTrial] = await Promise.all([
            checkStripePlan(userEmail, this.dependencies.browserAPIs),
            enforceTrialPeriod(this.dependencies.browserAPIs, userSignupDate),
        ])

        const selectedPowerUps = new Set<PremiumPlans>()
        const activePowerUps = new Set<PremiumPlans>()
        for (const [key, value] of Object.entries(activatedPowerUps)) {
            if (value) {
                selectedPowerUps.add(key as PremiumPlans)
                activePowerUps.add(key as PremiumPlans)
            }
        }

        this.emitMutation({
            remainingTrialDays: { $set: isTrial },
            activatedPowerUps: { $set: activePowerUps },
            selectedPowerUps: { $set: selectedPowerUps },
            userEmail: { $set: userEmail },
            authLoadState: { $set: 'success' },
        })
    }

    changeModalType: EventHandler<'changeModalType'> = async ({ event }) => {
        this.emitMutation({
            powerUpType: { $set: event },
        })
    }
    setPowerUpConfirmation: EventHandler<'setPowerUpConfirmation'> = async ({
        event,
    }) => {
        this.emitMutation({
            confirmPowerups: { $set: event.selected },
        })
    }

    selectPowerUps: EventHandler<'selectPowerUps'> = async ({
        event,
        previousState,
    }) => {
        let currentlySelected = previousState.selectedPowerUps

        currentlySelected.add(event.plan)

        if (event.plan === 'lifetime') {
            currentlySelected = new Set(['lifetime'])
        } else if (
            event.plan === 'AIpowerup' ||
            (event.plan === 'bookmarksPowerUp' &&
                currentlySelected?.has('lifetime'))
        ) {
            currentlySelected?.delete('lifetime')
        }

        let currentlyToBeRemoved = previousState.removedPowerUps

        if (currentlyToBeRemoved?.has(event.plan)) {
            currentlyToBeRemoved.delete(event.plan)
        }

        this.emitMutation({
            selectedPowerUps: { $set: currentlySelected },
            removedPowerUps: { $set: currentlyToBeRemoved },
        })
    }

    unSelectPowerUps: EventHandler<'unSelectPowerUps'> = async ({
        event,
        previousState,
    }) => {
        let currentlySelected = previousState.selectedPowerUps
        currentlySelected?.delete(event.plan)

        let toRemove = previousState.removedPowerUps ?? new Set()
        if (previousState.activatedPowerUps?.has(event.plan)) {
            console.log('adding to remove', event.plan)
            toRemove.add(event.plan)
        }

        console.log('currentlySelected', currentlySelected)
        this.emitMutation({
            selectedPowerUps: { $set: currentlySelected },
            removedPowerUps: { $set: toRemove },
        })
    }

    processCheckoutOpen: EventHandler<'processCheckoutOpen'> = async ({
        previousState,
    }) => {
        const doNotOpen =
            previousState.activatedPowerUps.has('AIpowerup') ||
            previousState.activatedPowerUps.has('bookmarksPowerUp')

        const billingPeriod = previousState.billingPeriod

        this.emitMutation({
            checkoutLoading: { $set: 'running' },
        })

        const upgradeResponse = await this.dependencies.createCheckOutLink({
            doNotOpen,
            billingPeriod,
            selectedPremiumPlans: Array.from(
                previousState.selectedPowerUps ?? [],
            ),
            removedPremiumPlans: Array.from(
                previousState.removedPowerUps ?? [],
            ),
        })

        console.log('upgradeResponse', upgradeResponse)

        if (upgradeResponse === 'error') {
            this.emitMutation({
                checkoutLoading: { $set: 'error' },
            })
            return
        } else if (upgradeResponse === 'success') {
            const updatedPlans = await checkStripePlan(
                previousState.userEmail,
                this.dependencies.browserAPIs,
            )

            let activatedPowerUps = new Set<PremiumPlans>()
            for (const [key, value] of Object.entries(updatedPlans)) {
                if (value) {
                    activatedPowerUps.add(key as PremiumPlans)
                }
            }

            this.emitMutation({
                activatedPowerUps: { $set: activatedPowerUps },
                removedPowerUps: { $set: new Set() },
                selectedPowerUps: { $set: activatedPowerUps },
                checkoutLoading: { $set: 'success' },
            })
        }
        if (doNotOpen === false) {
            this.emitMutation({
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
