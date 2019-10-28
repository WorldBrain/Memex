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
    FastSyncPreSendProcessor,
} from '@worldbrain/storex-sync/lib/fast-sync'
import {
    WebRTCFastSyncSenderChannel,
    WebRTCFastSyncReceiverChannel,
} from '@worldbrain/storex-sync/lib/fast-sync/channels'
import TypedEmitter from 'typed-emitter'
import StorageManager from '@worldbrain/storex'
import { createPassiveDataChecker } from 'src/storage/utils'
import { getObjectPk } from '@worldbrain/storex/lib/utils'
import { SyncSecretStore } from './secrets'
import {
    FastSyncSenderChannel,
    FastSyncReceiverChannel,
} from '@worldbrain/storex-sync/lib/fast-sync/types'

type InitialSyncInfo = {
    signalChannel: SignalChannel
    events: TypedEmitter<InitialSyncEvents>
    finishPromise: Promise<void>
} & (
    | {
          role: 'sender'
          senderFastSyncChannel: FastSyncSenderChannel
          senderFastSync: FastSyncSender
      }
    | {
          role: 'receiver'
          receiverFastSyncChannel: FastSyncReceiverChannel
          receiverFastSync: FastSyncReceiver
      })

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
            secrectStore: SyncSecretStore
        },
    ) {}

    async requestInitialSync(options?: {
        excludePassiveData?: boolean
    }): Promise<{ initialMessage: string }> {
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
            ...(options || {}),
        })

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
    }

    async waitForInitialSync(): Promise<void> {
        if (this.initialSyncInfo) {
            await this.initialSyncInfo.finishPromise
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
        excludePassiveData?: boolean
    }): Promise<InitialSyncInfo> {
        const signalChannel = await options.signalTransport.openChannel(
            pick(options, 'initialMessage', 'deviceId'),
        )
        const peer = new Peer({
            initiator: options.role === 'receiver',
            wrtc: this.wrtc,
        })

        let senderFastSyncChannel: FastSyncSenderChannel | undefined
        let receiverFastSyncChannel: FastSyncReceiverChannel | undefined
        let senderFastSync: FastSyncSender | undefined
        let receiverFastSync: FastSyncReceiver | undefined
        let fastSync: {
            execute: () => Promise<void>
            events: TypedEmitter<FastSyncEvents & InitialSyncEvents>
        }

        if (options.role === 'sender') {
            senderFastSyncChannel = new WebRTCFastSyncSenderChannel({ peer })
            senderFastSync = new FastSyncSender({
                storageManager: this.options.storageManager,
                channel: senderFastSyncChannel,
                collections: this.options.syncedCollections,
                preSendProcessor:
                    options.excludePassiveData &&
                    _createExcludePassivePreSendFilter({
                        storageManager: this.options.storageManager,
                    }),
            })
            fastSync = senderFastSync
        } else {
            receiverFastSyncChannel = new WebRTCFastSyncReceiverChannel({
                peer,
            })
            receiverFastSync = new FastSyncReceiver({
                storageManager: this.options.storageManager,
                channel: receiverFastSyncChannel,
            })
            fastSync = receiverFastSync
        }

        const buildInfo = (): InitialSyncInfo => {
            const common = {
                signalChannel,
                finishPromise,
                events: fastSync.events,
            }
            if (options.role === 'sender') {
                return {
                    role: 'sender',
                    ...common,
                    senderFastSync,
                    senderFastSyncChannel,
                }
            } else {
                return {
                    role: 'receiver',
                    ...common,
                    receiverFastSync,
                    receiverFastSyncChannel,
                }
            }
        }

        const finishPromise: Promise<void> = (async () => {
            // fastSync.events.emit = ((eventName: string, event: any) => {
            //     console.log('sync event', eventName, event)
            //     return true
            // }) as any

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

            await this.preSync(buildInfo())
            await fastSync.execute()
            fastSync.events.emit('finished', {})
        })()

        return buildInfo()
    }

    protected async preSync(options: InitialSyncInfo) {
        const { secrectStore } = this.options
        if (options.role === 'sender') {
            let key = await secrectStore.getSyncEncryptionKey()
            if (!key) {
                await secrectStore.generateSyncEncryptionKey()
                key = await secrectStore.getSyncEncryptionKey()
            }
            await options.senderFastSyncChannel.sendUserPackage({
                type: 'encryption-key',
                key,
            })
        } else {
            const userPackage = await options.receiverFastSyncChannel.receiveUserPackage()
            if (userPackage.type !== 'encryption-key') {
                throw new Error(
                    'Expected to receive encryption key in inital sync, but got ' +
                        userPackage.type,
                )
            }
            await secrectStore.setSyncEncryptionKey(userPackage.key)
        }
    }
}

export function _createExcludePassivePreSendFilter(dependencies: {
    storageManager: StorageManager
}): FastSyncPreSendProcessor {
    const isPassiveData = createPassiveDataChecker(dependencies)
    return async params => {
        return (await isPassiveData({
            collection: params.collection,
            pk: getObjectPk(
                params.object,
                params.collection,
                dependencies.storageManager.registry,
            ),
        }))
            ? { object: null }
            : params
    }
}
