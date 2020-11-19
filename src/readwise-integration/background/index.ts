import StorageManager from '@worldbrain/storex'
import { LimitedBrowserStorage } from 'src/util/tests/browser-storage'
import ActionQueue from '@worldbrain/memex-common/lib/action-queue'
import {
    ActionExecutor,
    ActionQueueInteraction,
    ActionPreprocessor,
} from '@worldbrain/memex-common/lib/action-queue/types'
import { STORAGE_VERSIONS } from '@worldbrain/memex-common/lib/browser-extension/storage/versions'
import { StorageOperationEvent } from '@worldbrain/storex-middleware-change-watcher/lib/types'
import * as Raven from 'src/util/raven'
import { ReadwiseAPI, ReadwiseHighlight } from './types/api'
import { ReadwiseSettings } from './types/settings'
import { ReadwiseAction } from './types/actions'
import { HTTPReadwiseAPI } from './readwise-api'
import { SettingStore, BrowserSettingsStore } from 'src/util/settings'
import { Annotation } from 'src/annotations/types'
import { READWISE_ACTION_RETRY_INTERVAL } from './constants'
import { ReadwiseInterface } from './types/remote-interface'
import {
    remoteFunctionWithoutExtraArgs,
    registerRemoteFunctions,
} from 'src/util/webextensionRPC'
import { Page } from 'src/search'

type ReadwiseInterfaceMethod<
    Method extends keyof ReadwiseInterface<'provider'>
> = ReadwiseInterface<'provider'>[Method]['function']

type PageData = Pick<Page, 'fullTitle' | 'fullUrl' | 'url'>
type GetPageData = (normalizedUrl: string) => Promise<PageData>

export class ReadwiseBackground {
    remoteFunctions: ReadwiseInterface<'provider'>
    settingsStore: SettingStore<ReadwiseSettings>
    readwiseAPI: ReadwiseAPI
    actionQueue: ActionQueue<ReadwiseAction>
    uploadBatchSize = 10
    _apiKeyLoaded = false
    _apiKey?: string

    constructor(
        private options: {
            storageManager: StorageManager
            browserStorage: LimitedBrowserStorage
            fetch: typeof fetch
            getPageData: GetPageData
            getAnnotationsByPks: (
                annotationUrls: string[],
            ) => Promise<Annotation[]>
            streamAnnotations(): AsyncIterableIterator<Annotation>
        },
    ) {
        this.settingsStore = new BrowserSettingsStore<ReadwiseSettings>(
            options.browserStorage,
            {
                prefix: 'readwise.',
            },
        )
        this.readwiseAPI = new HTTPReadwiseAPI({
            fetch: options.fetch,
        })
        this.actionQueue = new ActionQueue({
            storageManager: options.storageManager,
            collectionName: 'readwiseAction',
            versions: { initial: STORAGE_VERSIONS[22].version },
            retryIntervalInMs: READWISE_ACTION_RETRY_INTERVAL,
            executeAction: this.executeAction,
            preprocessAction: this.preprocessAction,
        })
        this.remoteFunctions = {
            validateAPIKey: remoteFunctionWithoutExtraArgs(this.validateAPIKey),
            getAPIKey: remoteFunctionWithoutExtraArgs(this.getAPIKey),
            setAPIKey: remoteFunctionWithoutExtraArgs(this.setAPIKey),
            uploadAllAnnotations: remoteFunctionWithoutExtraArgs(
                this.uploadAllAnnotations,
            ),
        }
    }

    setupRemoteFunctions() {
        registerRemoteFunctions(this.remoteFunctions)
    }

    validateAPIKey: ReadwiseInterfaceMethod<'validateAPIKey'> = async ({
        key,
    }) => {
        const result = await this.readwiseAPI.validateKey(key)
        return result
    }

    getAPIKey: ReadwiseInterfaceMethod<'getAPIKey'> = async () => {
        if (this._apiKeyLoaded) {
            return this._apiKey
        }

        this._apiKey = await this.settingsStore.get('apiKey')
        this._apiKeyLoaded = true
        return this._apiKey
    }

    setAPIKey: ReadwiseInterfaceMethod<'setAPIKey'> = async ({
        validatedKey,
    }) => {
        await this.settingsStore.set('apiKey', validatedKey)
        this._apiKey = validatedKey
        this._apiKeyLoaded = true
    }

    uploadAllAnnotations: ReadwiseInterfaceMethod<
        'uploadAllAnnotations'
    > = async ({ queueInteraction }) => {
        // await new Promise((resolve) => setTimeout(resolve, 1000 * 3))
        // if (1) {
        //     return
        // }

        const getFullPageUrl = makePageDataCache({
            getPageData: this.options.getPageData,
        })

        let annotationBatch: Annotation[] = []
        const scheduleBatch = async () => {
            await this._scheduleAnnotationBatchUpload(annotationBatch, {
                queueInteraction,
                getPageData: getFullPageUrl,
            })
        }

        for await (const annotation of this.options.streamAnnotations()) {
            annotationBatch.push(annotation)
            if (annotationBatch.length === this.uploadBatchSize) {
                await scheduleBatch()
                annotationBatch = []
            }
        }
        if (annotationBatch.length) {
            await scheduleBatch()
        }
    }

    async _scheduleAnnotationBatchUpload(
        annotations: Annotation[],
        options: {
            getPageData: GetPageData
            queueInteraction: ActionQueueInteraction
        },
    ) {
        await this.actionQueue.scheduleAction(
            {
                type: 'post-highlights',
                highlights: (
                    await Promise.all(
                        annotations.map(async (annotation) => {
                            try {
                                const pageData = await options.getPageData(
                                    annotation.pageUrl,
                                )
                                return annotationToReadwise(annotation, {
                                    pageData,
                                })
                            } catch (e) {
                                console.error(e)
                                Raven.captureException(e)
                                return null
                            }
                        }),
                    )
                ).filter((highlight) => !!highlight),
            },
            { queueInteraction: options.queueInteraction },
        )
    }

    executeAction: ActionExecutor<ReadwiseAction> = async ({ action }) => {
        const key = await this.getAPIKey()
        if (!key) {
            throw new Error(
                `Tried to execute Readwise action without providing API key`,
            )
        }

        if (action.type === 'post-highlights') {
            await this.readwiseAPI.postHighlights({
                key,
                highlights: action.highlights,
            })
        }
    }

    preprocessAction: ActionPreprocessor<ReadwiseAction> = () => {
        return { valid: true }
    }

    async handlePostStorageChange(
        event: StorageOperationEvent<'post'>,
        options: {
            source: 'sync' | 'local'
        },
    ) {
        if (!(await this.getAPIKey())) {
            return
        }

        const getPageData = makePageDataCache({
            getPageData: this.options.getPageData,
        })

        for (const change of event.info.changes) {
            if (change.collection !== 'annotations') {
                continue
            }

            if (change.type === 'create') {
                try {
                    const annotation = {
                        url: change.pk as string,
                        ...change.values,
                    } as Annotation

                    const pageData = await getPageData(annotation.pageUrl)
                    await this.actionQueue.scheduleAction(
                        {
                            type: 'post-highlights',
                            highlights: [
                                annotationToReadwise(annotation, {
                                    pageData,
                                }),
                            ],
                        },
                        { queueInteraction: 'queue-and-return' },
                    )
                } catch (e) {
                    console.error(e)
                    Raven.captureException(e)
                }
            } else if (change.type === 'modify') {
                try {
                    const annotations = await this.options.getAnnotationsByPks(
                        change.pks as string[],
                    )
                    const highlights: ReadwiseHighlight[] = await Promise.all(
                        annotations.map(async (annotation) => {
                            const pageData = await getPageData(
                                annotation.pageUrl,
                            )
                            return annotationToReadwise(annotation, {
                                pageData,
                            })
                        }),
                    )
                    await this.actionQueue.scheduleAction(
                        { type: 'post-highlights', highlights },
                        { queueInteraction: 'queue-and-return' },
                    )
                } catch (e) {
                    console.error(e)
                    Raven.captureException(e)
                }
            }
        }
    }
}

function annotationToReadwise(
    annotation: Omit<Annotation, 'pageTitle'>,
    options: { pageData: PageData },
): ReadwiseHighlight {
    const today = new Date()
    const date =
        today.getFullYear() +
        '-' +
        (today.getMonth() + 1) +
        '-' +
        today.getDate()
    const time =
        today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds()
    const dateTime = date + ' ' + time

    return {
        title: options.pageData.fullTitle ?? options.pageData.url,
        source_url: options.pageData.fullUrl,
        source_type: 'article',
        note: annotation.comment?.length ? annotation.comment : undefined,
        location_type: 'time_offset',
        highlighted_at: annotation.createdWhen,
        text: annotation?.body?.length
            ? annotation.body
            : 'Memex note from: ' + dateTime,
    }
}

function makePageDataCache(options: { getPageData: GetPageData }) {
    const pageDataCache: { [normalizedUrl: string]: PageData } = {}
    const getPageData = async (normalizedUrl: string) => {
        if (pageDataCache[normalizedUrl]) {
            return pageDataCache[normalizedUrl]
        }
        const fullUrl = await options.getPageData(normalizedUrl)
        if (!fullUrl) {
            throw new Error(
                `Can't get full URL for annotation to upload to Readwise`,
            )
        }
        pageDataCache[normalizedUrl] = fullUrl
        return fullUrl
    }
    return getPageData
}
