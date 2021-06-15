import type { UIEventHandler } from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import {
    UILogic,
    loadInitial,
    executeUITask,
} from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import delay from 'src/util/delay'

import { Event, State, Dependencies } from './types'

type EventHandler<EventName extends keyof Event> = UIEventHandler<
    State,
    Event,
    EventName
>

export default class CloudOnboardingModalLogic extends UILogic<State, Event> {
    constructor(private dependencies: Dependencies) {
        super()
    }

    async init() {
        const { authBG } = this.dependencies
        await loadInitial(this, async () => {
            const user = await authBG.getCurrentUser()

            if (user) {
                this.emitMutation({ currentUser: { $set: user } })
            }

            // TODO: check for passive data and decide which next stage to set
            this.emitMutation({ needsToRemovePassiveData: { $set: true } })
        })
    }

    getInitialState = (): State => ({
        loadState: 'pristine',
        backupState: 'pristine',
        migrationState: 'pristine',
        dataCleaningState: 'pristine',

        currentUser: null,
        stage: 'pick-plan',
        tier2PaymentPeriod: 'monthly',
        needsToRemovePassiveData: false,
    })

    private async attemptDataDump() {
        await executeUITask(this, 'backupState', async () => {
            await delay(2000)
            // Uncomment this to show error state:
            // throw new Error()
        })
    }

    private async attemptPassiveDataClean() {
        await executeUITask(this, 'dataCleaningState', async () => {
            await delay(2000)
            // Uncomment this to show error state:
            // throw new Error()
        })
    }

    private async attemptCloudMigration() {
        await executeUITask(this, 'migrationState', async () => {
            await delay(2000)
            // Uncomment this to show error state:
            // throw new Error()
        })
    }

    setTier2PaymentPeriod: EventHandler<'setTier2PaymentPeriod'> = ({
        event,
    }) => {
        this.emitMutation({ tier2PaymentPeriod: { $set: event.period } })
    }

    selectPlan: EventHandler<'selectPlan'> = ({ event, previousState }) => {
        console.log('selected plan:', event.tier)
        // TODO: open link to payment page

        this.emitMutation({
            stage: {
                $set: previousState.needsToRemovePassiveData
                    ? 'data-dump'
                    : 'data-migration',
            },
        })
    }

    startDataDump: EventHandler<'startDataDump'> = async ({}) => {
        await this.attemptDataDump()
    }

    retryDataDump: EventHandler<'retryDataDump'> = async ({}) => {
        await this.attemptDataDump()
    }

    cancelDataDump: EventHandler<'cancelDataDump'> = async ({}) => {
        this.emitMutation({ backupState: { $set: 'pristine' } })
    }

    retryDataClean: EventHandler<'retryDataClean'> = async ({}) => {
        await this.attemptPassiveDataClean()
    }

    cancelDataClean: EventHandler<'cancelDataClean'> = async ({}) => {
        this.emitMutation({ stage: { $set: 'pick-plan' } })
    }

    retryDataMigration: EventHandler<'retryDataMigration'> = async ({}) => {
        await this.attemptCloudMigration()
    }

    cancelDataMigration: EventHandler<'cancelDataMigration'> = async ({}) => {
        this.emitMutation({ stage: { $set: 'pick-plan' } })
    }

    continueToMigration: EventHandler<'continueToMigration'> = async ({
        previousState,
    }) => {
        if (previousState.needsToRemovePassiveData) {
            await this.attemptPassiveDataClean()
        }

        this.emitMutation({ stage: { $set: 'data-migration' } })
        await this.attemptCloudMigration()
    }

    finishMigration: EventHandler<'finishMigration'> = async ({}) => {
        this.dependencies.onModalClose()
    }
}
