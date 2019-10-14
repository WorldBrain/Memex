import pick from 'lodash/pick'
import Peer from 'simple-peer'
import { SignalTransport, SignalChannel } from 'simple-signalling/lib/types'
import {
    signalSimplePeer,
    SimplePeerSignallingEvents,
} from 'simple-signalling/lib/simple-peer'
import {
    FastSyncSender,
    FastSyncReceiver,
    FastSyncEvents,
} from '@worldbrain/storex-sync/lib/fast-sync'
import {
    WebRTCFastSyncSenderChannel,
    WebRTCFastSyncReceiverChannel,
} from '@worldbrain/storex-sync/lib/fast-sync/channels'
import TypedEmitter from 'typed-emitter'
import StorageManager from '@worldbrain/storex'

interface InitialSyncInfo {
    signalChannel: SignalChannel
    execute: () => Promise<void>
    events: TypedEmitter<InitialSyncEvents>
    senderFastSync?: FastSyncSender
    receiverFastSync?: FastSyncReceiver
}

type InitialSyncEvents = FastSyncEvents &
    SimplePeerSignallingEvents & {
        connecting: {}
        releasingSignalChannel: {}
        connected: {}
        finished: {}
    }

export type SignalTransportFactory = () => SignalTransport
export default class InitialSync {
    public wrtc: any // Possibility for tests to inject wrtc library
    private initialSyncInfo?: InitialSyncInfo

    constructor(
        private options: {
            storageManager: StorageManager
            signalTransportFactory: SignalTransportFactory
            syncedCollections: string[]
        },
    ) {}

    async requestInitialSync(): Promise<{ initialMessage: string }> {
        const role = 'sender'
        const {
            signalTransport,
            initialMessage,
        } = await this._createSignalTransport(role)
        this.initialSyncInfo = await this._setupInitialSync({
            role,
            signalTransport,
            initialMessage,
            deviceId: 'first',
        })
        this.initialSyncInfo.execute()

        return { initialMessage }
    }

    async answerInitialSync(options: {
        initialMessage: string
    }): Promise<void> {
        const role = 'receiver'
        const { signalTransport } = await this._createSignalTransport(role)
        this.initialSyncInfo = await this._setupInitialSync({
            role,
            signalTransport,
            initialMessage: options.initialMessage,
            deviceId: 'second',
        })
        this.initialSyncInfo.execute()
    }

    async waitForInitialSync(): Promise<void> {
        if (this.initialSyncInfo) {
            await this.initialSyncInfo.execute()
        }
    }

    _createSignalTransport(
        role: 'sender',
    ): Promise<{ signalTransport: SignalTransport; initialMessage: string }>
    _createSignalTransport(
        role: 'receiver',
    ): Promise<{ signalTransport: SignalTransport }>
    async _createSignalTransport(
        role: 'sender' | 'receiver',
    ): Promise<{
        signalTransport: SignalTransport
        initialMessage: string | undefined
    }> {
        const signalTransport: SignalTransport = this.options.signalTransportFactory()
        return {
            signalTransport,
            initialMessage:
                role === 'sender'
                    ? (await signalTransport.allocateChannel()).initialMessage
                    : undefined,
        }
    }

    async _setupInitialSync(options: {
        role: 'sender' | 'receiver'
        signalTransport: SignalTransport
        initialMessage: string
        deviceId: 'first' | 'second'
    }): Promise<InitialSyncInfo> {
        const signalChannel = await options.signalTransport.openChannel(
            pick(options, 'initialMessage', 'deviceId'),
        )
        const peer = new Peer({
            initiator: options.role === 'receiver',
            wrtc: this.wrtc,
        })

        let senderFastSync: FastSyncSender | undefined
        let receiverFastSync: FastSyncReceiver | undefined
        let fastSync: {
            execute: () => Promise<void>
            events: TypedEmitter<FastSyncEvents & InitialSyncEvents>
        }
        if (options.role === 'sender') {
            const senderChannel = new WebRTCFastSyncSenderChannel({ peer })
            senderFastSync = new FastSyncSender({
                storageManager: this.options.storageManager,
                channel: senderChannel,
                collections: this.options.syncedCollections,
            })
            fastSync = senderFastSync
        } else {
            const receiverChannel = new WebRTCFastSyncReceiverChannel({ peer })
            receiverFastSync = new FastSyncReceiver({
                storageManager: this.options.storageManager,
                channel: receiverChannel,
            })
            fastSync = receiverFastSync
        }

        let executePromise: Promise<void>
        const execute = () => {
            if (executePromise) {
                return executePromise
            }
            executePromise = (async () => {
                fastSync.events.emit = ((eventName: string, event: any) => {
                    console.log('sync event', eventName, event)
                    return true
                }) as any

                fastSync.events.emit('connecting', {})
                await signalChannel.connect()
                await signalSimplePeer({
                    signalChannel,
                    simplePeer: peer,
                    reporter: (eventName, event) =>
                        (fastSync.events as any).emit(eventName, event),
                })
                fastSync.events.emit('releasingSignalChannel', {})
                await signalChannel.release()
                fastSync.events.emit('connected', {})
                await fastSync.execute()
                fastSync.events.emit('finished', {})
            })()
            return executePromise
        }

        return {
            signalChannel,
            execute,
            events: fastSync.events,
            senderFastSync,
            receiverFastSync,
        }
    }
}
