import type { UIEventHandler } from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import {
    UILogic,
    executeUITask,
} from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import { dumpDB } from 'src/personal-cloud/storage/dump-db-contents'

export interface State {
    dumpState: UITaskState
    dumpPercentComplete: number
}

export interface Event {
    startDataDump: null
    retryDataDump: null
    cancelDataDump: null
    completeDataDump: null
}

export interface Dependencies {
    disableAutoStart?: boolean
    onComplete: () => void
    onCancel: () => void
}

type EventHandler<EventName extends keyof Event> = UIEventHandler<
    State,
    Event,
    EventName
>

export default class DataDumperLogic extends UILogic<State, Event> {
    constructor(private dependencies: Dependencies) {
        super()
    }

    getInitialState = (): State => ({
        dumpState: 'pristine',
        dumpPercentComplete: 0,
    })

    async init() {
        if (!this.dependencies.disableAutoStart) {
            await this.attemptDataDump()
        }
    }

    private async attemptDataDump() {
        await executeUITask(this, 'dumpState', async () => {
            await dumpDB({
                progressCallback: ({ completedTables, totalTables }) => {
                    this.emitMutation({
                        dumpPercentComplete: {
                            $set: completedTables / totalTables,
                        },
                    })
                    return true
                },
            })
        })
    }

    startDataDump: EventHandler<'startDataDump'> = async ({}) => {
        await this.attemptDataDump()
    }

    retryDataDump: EventHandler<'retryDataDump'> = async ({}) => {
        await this.attemptDataDump()
    }

    cancelDataDump: EventHandler<'cancelDataDump'> = async ({}) => {
        this.dependencies.onCancel()
    }

    completeDataDump: EventHandler<'completeDataDump'> = async ({}) => {
        this.dependencies.onComplete()
    }
}
