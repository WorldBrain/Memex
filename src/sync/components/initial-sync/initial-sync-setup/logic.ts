import { UILogic, UIEvent } from 'ui-logic-core'
import { getRemoteEventEmitter } from 'src/util/webextensionRPC'

type SyncSetupState = 'introduction' | 'pair' | 'sync' | 'done'

export interface InitialSyncSetupState {
    status: SyncSetupState
    initialSyncMessage?: string
    error?: string
    progressPct?: number
}
export type InitialSyncSetupEvent = UIEvent<{
    start: {}
}>
export interface InitialSyncSetupDependencies {
    onClose?: () => void
    waitForInitialSyncConnected: () => Promise<any>
    waitForInitialSync: () => Promise<any>
    getInitialSyncMessage: () => Promise<string>
}

export default class InitialSyncSetupLogic extends UILogic<
    InitialSyncSetupState,
    InitialSyncSetupEvent
> {
    constructor(private dependencies: InitialSyncSetupDependencies) {
        super()
    }

    getInitialState(): InitialSyncSetupState {
        return {
            status: 'introduction',
        }
    }

    async start() {
        const eventEmitter = getRemoteEventEmitter('sync')

        const log = (event, args) =>
            console.log(`FROM remote event emitter: ${event} ${args}`)
        eventEmitter.on('progress', args => log('progress', args))
        eventEmitter.on('connecting', args => log('connecting', args))
        eventEmitter.on('preSyncSuccess', args => log('preSyncSuccess', args))

        this.emitMutation({
            status: { $set: 'pair' },
        })
        this.emitMutation({
            initialSyncMessage: {
                $set: await this.dependencies.getInitialSyncMessage(),
            },
        })

        try {
            await this.dependencies.waitForInitialSyncConnected()
            this.emitMutation({
                status: { $set: 'sync' },
            })
        } catch (e) {
            this.error(e)
        }

        try {
            await this.dependencies.waitForInitialSync()
            this.emitMutation({
                status: { $set: 'done' },
            })
        } catch (e) {
            this.error(e)
        }
    }

    error(e) {
        console.error(e)
        this.emitMutation({
            error: { $set: `${e}` },
        })
    }
}
