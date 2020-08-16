import { UILogic, UIEvent } from 'ui-logic-core'
import TypedEventEmitter from 'typed-emitter'
import { InitialSyncEvents } from '@worldbrain/storex-sync/lib/integration/initial-sync'
import { FastSyncEvents } from '@worldbrain/storex-sync/lib/fast-sync'
import analytics from 'src/analytics'
import { now } from 'moment'

type SyncSetupState =
    | 'introduction'
    | 'pair'
    | 'sync'
    | 'done'
    | 'noConnection'
    | 'error'

export interface InitialSyncSetupState {
    status: SyncSetupState
    initialSyncMessage?: string
    error?: string
    progressPct?: number
    stage?: string
}

export type InitialSyncSetupEvent = UIEvent<{
    start: {}
    backToIntroduction: {}
    cancel: {}
    retry: {}
}>

export interface InitialSyncSetupDependencies {
    onClose?: () => void
    waitForInitialSyncConnected: () => Promise<any>
    waitForInitialSync: () => Promise<any>
    getInitialSyncMessage: () => Promise<string>
    getSyncEventEmitter: () => TypedEventEmitter<InitialSyncEvents>
    open: boolean
    abortInitialSync: () => Promise<void>
    removeAllDevices: () => Promise<void>
}

export default class InitialSyncSetupLogic extends UILogic<
    InitialSyncSetupState,
    InitialSyncSetupEvent
> {
    eventEmitter: TypedEventEmitter<InitialSyncEvents> = null
    private _started: number

    private get runningTime() {
        return this._started ? now() - this._started : 0
    }

    constructor(private dependencies: InitialSyncSetupDependencies) {
        super()
    }

    getInitialState(): InitialSyncSetupState {
        return {
            status: 'introduction',
            stage: '1/2',
        }
    }

    updateProgress = (event: Parameters<FastSyncEvents['progress']>[0]) => {
        // console.log('UI Logic received event [progress]:', event)

        this.emitMutation({
            status: { $set: 'sync' },
            progressPct: {
                $set:
                    event.progress.totalObjectsProcessed /
                    event.progress.objectCount,
            },
        })
    }

    updateRole = (event: Parameters<FastSyncEvents['roleSwitch']>[0]) => {
        // console.log('UI Logic received event [roleSwitch]:', event)

        // Currently assuming that this always happens once for two way sync, 1) A->B, 2) B+A->A
        this.emitMutation({
            progressPct: { $set: 0 },
            stage: { $set: `2/2` },
        })
    }

    updateError = (event: Parameters<FastSyncEvents['error']>[0]) => {
        // console.log('UI Logic received event [roleSwitch]:', event)
        this.emitMutation({
            status: { $set: 'sync' },
            error: { $set: event.error },
        })
    }

    registerListeners = () => {
        this.eventEmitter.on('progress', this.updateProgress)
        this.eventEmitter.on('roleSwitch', this.updateRole)
        this.eventEmitter.on('error', this.updateError)
        // this.eventEmitter.on(
        //     'packageStalled',
        //     this.handleTimeout(new Error('Package send/receive timed out')),
        // )
        this.eventEmitter.on(
            'channelTimeout',
            this.handleChannelTimeout(new Error(`Fast sync channel timed out`)),
        )
        this.eventEmitter.on('finished', this.done)
    }

    cleanup() {
        if (this.eventEmitter != null) {
            this.eventEmitter.removeAllListeners('progress')
            this.eventEmitter.removeAllListeners('roleSwitch')
            this.eventEmitter.removeAllListeners('error')
            this.eventEmitter.removeAllListeners('finished')
            // this.eventEmitter.removeAllListeners('packageStalled')
            this.eventEmitter.removeAllListeners('channelTimeout')
        }
    }

    async detectFirebaseFlag() {
        if (await localStorage.getItem('firebase:previous_websocket_failure')) {
            this.emitMutation({
                status: { $set: 'noConnection' },
            })
        }
    }

    start = async () => {
        this.emitMutation({
            status: { $set: 'pair' },
        })
        this.detectFirebaseFlag()

        setTimeout(() => {
            this.detectFirebaseFlag()
        }, 2000)
        setTimeout(() => {
            this.detectFirebaseFlag()
        }, 10000)
        setTimeout(() => {
            this.detectFirebaseFlag()
        }, 15000)

        this.eventEmitter = this.dependencies.getSyncEventEmitter()
        this._started = now()
        this.registerListeners()

        const initSyncMessage = await this.dependencies.getInitialSyncMessage()
        console.log('Sync message:', initSyncMessage)

        this.emitMutation({
            initialSyncMessage: { $set: initSyncMessage },
        })

        analytics.trackEvent({ category: 'Sync', action: 'startInitSync' })

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
            analytics.trackEvent({
                category: 'Sync',
                action: 'finishInitSync',
                duration: this.runningTime,
            })
        } catch (e) {
            this.error(e)
        }
    }

    cancel = () => {
        return this.dependencies.abortInitialSync()
    }

    retry = () => {
        // N.B. For retries, existing devices need to be deleted
        return this.dependencies.onClose()
    }

    backToIntroduction = () => {
        this.emitMutation({
            status: { $set: 'introduction' },
            stage: { $set: '1/2' },
        })
    }

    done = () => {
        this.emitMutation({
            status: { $set: 'done' },
        })
    }

    private error(e: Error) {
        analytics.trackEvent({
            category: 'Sync',
            action: 'failInitSync',
            duration: this.runningTime,
        })

        this.emitMutation({
            status: { $set: 'error' },
            error: { $set: `${e}` },
        })
    }

    private handleChannelTimeout = (e: Error) => async () => {
        this.error(e)
        await this.dependencies.abortInitialSync()
        await this.dependencies.removeAllDevices()
    }
}
