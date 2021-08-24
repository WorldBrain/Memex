import type { UIEventHandler } from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import {
    UILogic,
    loadInitial,
    executeUITask,
} from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import delay from 'src/util/delay'
import { BACKUP_URL } from 'src/constants'
import type { Event, State, Dependencies } from './types'

type EventHandler<EventName extends keyof Event> = UIEventHandler<
    State,
    Event,
    EventName
>

export default class CloudOnboardingModalLogic extends UILogic<State, Event> {
    constructor(private dependencies: Dependencies) {
        super()
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

    async init() {
        const {
            authBG,
            backupBG,
            personalCloudBG,
            onModalClose,
        } = this.dependencies
        await loadInitial(this, async () => {
            const user = await authBG.getCurrentUser()

            if (user) {
                this.emitMutation({ currentUser: { $set: user } })
            } else {
                // We can't do the migration if not logged in
                return onModalClose()
            }

            const needsToRemovePassiveData = await personalCloudBG.isPassiveDataRemovalNeeded()
            this.emitMutation({
                needsToRemovePassiveData: { $set: needsToRemovePassiveData },
            })

            const { lastBackup } = await backupBG.getBackupTimes()
            this.emitMutation({
                shouldBackupViaDump: { $set: lastBackup == null },
            })
        })
    }

    private async attemptDataDump() {
        await executeUITask(this, 'backupState', async () => {
            await delay(2000)
            // Uncomment this to show error state:
            // throw new Error()
        })
    }

    private async attemptPassiveDataClean(state: State) {
        await executeUITask(this, 'dataCleaningState', async () => {
            await delay(2000)
            // Uncomment this to show error state:
            // throw new Error()
        })

        await this.continueToMigration({
            event: null,
            previousState: this.withMutation(state, {
                needsToRemovePassiveData: { $set: false },
            }),
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

    startDataClean: EventHandler<'startDataClean'> = async ({
        previousState,
    }) => {
        await this.attemptPassiveDataClean(previousState)
    }

    retryDataClean: EventHandler<'retryDataClean'> = async ({
        previousState,
    }) => {
        await this.attemptPassiveDataClean(previousState)
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
