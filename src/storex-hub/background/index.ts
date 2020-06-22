import io from 'socket.io-client'
import StorageManager from '@worldbrain/storex'
import { StorageOperationEvent } from '@worldbrain/storex-middleware-change-watcher/lib/types'
import { createStorexHubSocketClient } from '@worldbrain/storex-hub/lib/client'
import {
    StorexHubApi_v0,
    StorexHubCallbacks_v0,
    HandleRemoteCallResult_v0,
} from '@worldbrain/storex-hub/lib/public-api'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import {
    FetchPageProcessor,
    PageContent,
} from 'src/page-analysis/background/types'
import { IndexPageArgs } from './types'
import { PipelineRes } from 'src/search'
import { Storage } from 'webextension-polyfill-ts'

const APP_NAME = 'io.worldbrain.memex'

export class StorexHubBackground {
    private socket?: SocketIOClient.Socket
    private client?: StorexHubApi_v0
    logger: (...args) => void
    development = false
    port?: number
    inMemory = false
    subscriptionCount = 0

    constructor(
        private dependencies: {
            storageManager: StorageManager
            fetchPageData: FetchPageProcessor
            storePageContent: (content: PageContent) => Promise<void>
            localBrowserStorage: Storage.LocalStorageArea
            addVisit: (visit: {
                normalizedUrl: string
                fullUrl: string
                time: number
            }) => Promise<void>
            addBookmark: (bookmark: {
                normalizedUrl: string
                fullUrl: string
                time: number
            }) => Promise<void>
            addTags: (params: {
                normalizedUrl: string
                fullUrl: string
                tags: string[]
            }) => Promise<void>
            addToLists: (params: {
                normalizedUrl: string
                fullUrl: string
                lists: number[]
            }) => Promise<void>
        },
    ) {
        this.logger = console['log'].bind(console)
    }

    async connect(options?: {
        port?: number
        development?: boolean
        inMemory?: boolean
    }) {
        this.port = options?.port
        this.development = options?.development ?? false
        this.inMemory = options.inMemory ?? false

        this.client = await this._createClient({
            callbacks: {
                handleRemoteOperation: async (event) => {
                    return {
                        result: await this.dependencies.storageManager.operation(
                            event.operation[0],
                            ...event.operation.slice(1),
                        ),
                    }
                },
                handleSubscription: async () => {
                    return {
                        subscriptionId: (++this.subscriptionCount).toString(),
                    }
                },
                handleRemoteCall: async (event) => {
                    if (event.call === 'indexPage') {
                        return this._indexPage(event.args)
                    }

                    return { status: 'call-not-found' }
                },
            },
        })
        await this.registerOrIdentify()
    }

    _createClient(options?: { callbacks?: StorexHubCallbacks_v0 }) {
        this.socket = io(
            `http://localhost:${
                this.port ?? (this.development ? 50483 : 50482)
            }`,
        )
        this.socket.on('reconnect', async () => {
            this.logger('Re-connected to Storex Hub')
            await this.registerOrIdentify()
        })
        this.socket.on('disconnect', async (reason: string) => {
            this.logger('Lost connection to Storex Hub:', reason)
        })
        return createStorexHubSocketClient(this.socket, {
            callbacks: options?.callbacks,
        })
    }

    async _indexPage(
        args: Partial<IndexPageArgs>,
    ): Promise<HandleRemoteCallResult_v0> {
        if (!args.url || typeof args.url !== 'string') {
            return { status: 'invalid-args' }
        }

        const fullUrl = args.url
        const normalizedUrl = normalizeUrl(fullUrl)

        let processedData: PipelineRes
        try {
            processedData = await this.dependencies.fetchPageData.process(
                fullUrl,
            )
        } catch (e) {
            return {
                status: 'internal-error',
                errorStatus: 'could-not-fetch',
                errorText: `Could not fetch page: ${e}`,
            }
        }

        try {
            await this.dependencies.storePageContent(processedData)
        } catch (e) {
            return {
                status: 'internal-error',
                errorStatus: 'could-not-index',
                errorText: `Error while indexing page: ${e}`,
            }
        }

        try {
            await this.dependencies.addVisit({
                fullUrl,
                normalizedUrl,
                time: args.visitTime ?? Date.now(),
            })
        } catch (e) {
            return {
                status: 'internal-error',
                errorStatus: 'could-not-add-visit',
                errorText: `Error while adding visit to page: ${e}`,
            }
        }

        try {
            if (args.bookmark) {
                const time =
                    typeof args.bookmark === 'boolean'
                        ? null
                        : args.bookmark.creationTime
                await this.dependencies.addBookmark({
                    fullUrl,
                    normalizedUrl,
                    time: time || Date.now(),
                })
            }
        } catch (e) {
            return {
                status: 'internal-error',
                errorStatus: 'could-not-bookmark',
                errorText: `Error while bookmarking page: ${e}`,
            }
        }

        try {
            if (args.tags) {
                await this.dependencies.addTags({
                    fullUrl,
                    normalizedUrl,
                    tags: args.tags,
                })
            }
        } catch (e) {
            return {
                status: 'internal-error',
                errorStatus: 'could-not-tag',
                errorText: `Error while adding tags to page: ${e}`,
            }
        }

        try {
            if (args.lists) {
                await this.dependencies.addToLists({
                    fullUrl,
                    normalizedUrl,
                    lists: args.lists,
                })
            }
        } catch (e) {
            return {
                status: 'internal-error',
                errorStatus: 'could-not-list',
                errorText: `Error while adding page to lists: ${e}`,
            }
        }

        return { status: 'success', result: {} }
    }

    handlePostStorageChange(event: StorageOperationEvent<'post'>) {
        if (!this.client) {
            return
        }

        this.client.emitEvent({
            event: { type: 'storage-change', info: event.info },
        })
    }

    async registerOrIdentify() {
        this.logger(`Identifying with Storex Hub as '${APP_NAME}'`)
        const key = `storex-hub.access-token.${
            this.development ? 'development' : 'production'
        }`
        const { [key]: existingAccessToken } = !this.inMemory
            ? await this.dependencies.localBrowserStorage.get(key)
            : { [key]: null }
        if (existingAccessToken) {
            this.logger(`Found existing access token, using it to identify`)
            const identificationResult = await this.client.identifyApp({
                name: APP_NAME,
                accessToken: existingAccessToken,
            })
            if (identificationResult.status !== 'success') {
                throw new Error(
                    `Couldn't identify app '${APP_NAME}': ${identificationResult.status}`,
                )
            }
        } else {
            this.logger(`Could not find existing access token, so registering`)
            const registrationResult = await this.client.registerApp({
                name: APP_NAME,
                identify: true,
                remote: true,
            })
            if (registrationResult.status === 'success') {
                const accessToken = registrationResult.accessToken
                if (!this?.inMemory) {
                    await this.dependencies.localBrowserStorage.set({
                        [key]: accessToken,
                    })
                }
            } else {
                throw new Error(
                    `Couldn't register app '${APP_NAME}'": ${registrationResult.status}`,
                )
            }
        }
        this.logger(`Successfuly identified with Storex Hub as '${APP_NAME}'`)
    }
}
