import io from 'socket.io-client'
import StorageManager from '@worldbrain/storex'
import { createStorexHubSocketClient } from '@worldbrain/storex-hub/lib/client'
import { StorexHubApi_v0 } from '@worldbrain/storex-hub/lib/public-api'
import { StorageOperationEvent } from '@worldbrain/storex-middleware-change-watcher/lib/types'

export class StorexHubBackground {
    private socket?: SocketIOClient.Socket
    private client?: StorexHubApi_v0

    constructor(
        private dependencies: {
            storageManager: StorageManager
        },
    ) {}

    async connect(options?: { port?: number }) {
        let subscriptionCount = 0
        this.socket = io(`http://localhost:${options?.port || 3000}`)
        this.client = await createStorexHubSocketClient(this.socket, {
            callbacks: {
                handleRemoteOperation: async event => {
                    return {
                        result: await this.dependencies.storageManager.operation(
                            event.operation[0],
                            ...event.operation.slice(1),
                        ),
                    }
                },
                handleSubscription: async () => {
                    return { subscriptionId: (++subscriptionCount).toString() }
                },
            },
        })
        await this.client.registerApp({
            name: 'memex',
            remote: true,
            identify: true,
        })
    }

    handlePostStorageChange(event: StorageOperationEvent<'post'>) {
        if (!this.client) {
            return
        }

        this.client.emitEvent({
            event: { type: 'storage-change', info: event.info },
        })
    }
}
