import type { UIEventHandler } from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import {
    UILogic,
    loadInitial,
    executeUITask,
} from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import delay from 'src/util/delay'
import { BACKUP_URL } from 'src/constants'
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

            // TODO: check whether the migration prep step has already been run
            this.emitMutation({ isMigrationPrepped: { $set: false } })

            // TODO: check for passive data and decide which next stage to set
            this.emitMutation({ needsToRemovePassiveData: { $set: true } })

            // TODO: check if backup was done in the last 2 months
            this.emitMutation({ shouldBackupViaDump: { $set: true } })
        })
    }

    getInitialState = (): State => ({
        loadState: 'pristine',
        backupState: 'pristine',
        migrationState: 'pristine',
        dataCleaningState: 'pristine',

        currentUser: null,
        stage: 'data-dump',

        isMigrationPrepped: false,
        shouldBackupViaDump: false,
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

    private async attemptCloudMigration({ isMigrationPrepped }: State) {
        await executeUITask(this, 'migrationState', async () => {
            if (!isMigrationPrepped) {
                await delay(2000) // TODO: migration prep step

                // TODO: set local storage key
                this.emitMutation({ isMigrationPrepped: { $set: true } })
            }

            await delay(2000)
            // Uncomment this to show error state:
            // throw new Error()
        })
    }

    migrateToOldVersion: EventHandler<'migrateToOldVersion'> = ({}) => {
        this.emitMutation({ stage: { $set: 'old-version-backup' } })
    }

    cancelMigrateToOldVersion: EventHandler<
        'cancelMigrateToOldVersion'
    > = ({}) => {
        this.emitMutation({ stage: { $set: 'data-dump' } })
    }

    goToBackupRoute: EventHandler<'goToBackupRoute'> = ({}) => {
        window.open(BACKUP_URL, '_self')
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

    startDataClean: EventHandler<'startDataClean'> = async ({}) => {
        await this.attemptPassiveDataClean()
    }

    retryDataClean: EventHandler<'retryDataClean'> = async ({}) => {
        await this.attemptPassiveDataClean()
    }

    cancelDataClean: EventHandler<'cancelDataClean'> = async ({}) => {
        this.dependencies.onModalClose()
    }

    retryMigration: EventHandler<'retryMigration'> = async ({
        previousState,
    }) => {
        await this.attemptCloudMigration(previousState)
    }

    cancelMigration: EventHandler<'cancelMigration'> = async ({}) => {
        this.dependencies.onModalClose()
    }

    closeMigration: EventHandler<'closeMigration'> = async ({}) => {
        this.dependencies.onModalClose()
    }

    continueToMigration: EventHandler<'continueToMigration'> = async ({
        previousState,
    }) => {
        if (previousState.needsToRemovePassiveData) {
            this.emitMutation({ stage: { $set: 'data-clean' } })
        } else {
            this.emitMutation({ stage: { $set: 'data-migration' } })
            await this.attemptCloudMigration(previousState)
        }
    }
}
