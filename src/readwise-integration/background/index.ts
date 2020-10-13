import MemoryBrowserStorage, {
    LimitedBrowserStorage,
} from 'src/util/tests/browser-storage'
import ActionQueue from '@worldbrain/memex-common/lib/action-queue'
import {
    ActionExecutor,
    ActionValidator,
} from '@worldbrain/memex-common/lib/action-queue/types'
import {
    ReadwiseResponse,
    ReadwiseSettings,
    ReadwiseAPI,
    ReadwiseAction,
    ReadwiseHighlight,
} from './types'
import { HTTPReadwiseAPI } from './readwise-api'
import { SettingStore, BrowserSettingsStore } from 'src/util/settings'
import { StorageOperationEvent } from '@worldbrain/storex-middleware-change-watcher/lib/types'
import { Annotation } from 'src/annotations/types'
import StorageManager from '@worldbrain/storex'
import { STORAGE_VERSIONS } from '@worldbrain/memex-common/lib/browser-extension/storage/versions'
import { READWISE_ACTION_RETRY_INTERVAL } from './constants'

export class ReadwiseBackground {
    mostRecentResponse?: ReadwiseResponse
    settingsStore: SettingStore<ReadwiseSettings>
    readwiseAPI: ReadwiseAPI
    actionQueue: ActionQueue<ReadwiseAction>
    _apiKeyLoaded = false
    _apiKey?: string

    constructor(
        private options: {
            storageManager: StorageManager
            browserStorage: LimitedBrowserStorage
            fetch: typeof fetch
            getFullPageUrl: (normalizedUrl: string) => Promise<string>
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
            validateAction: this.validateAction,
        })
    }

    async validateAPIKey(key: string) {
        const result = await this.readwiseAPI.validateKey(key)
        return result
    }

    async getAPIKey() {
        if (this._apiKeyLoaded) {
            return this._apiKey
        }

        this._apiKey = await this.settingsStore.get('apiKey')
        this._apiKeyLoaded = true
        return this._apiKey
    }

    async setAPIKey(validatedKey: string) {
        await this.settingsStore.set('apiKey', validatedKey)
        this._apiKey = validatedKey
        this._apiKeyLoaded = true
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

    validateAction: ActionValidator<ReadwiseAction> = () => {
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

        const fullPageUrls: { [normalizedUrl: string]: string } = {}
        const getFullPageUrl = async (normalizedUrl: string) => {
            if (fullPageUrls[normalizedUrl]) {
                return fullPageUrls[normalizedUrl]
            }
            const fullUrl = await this.options.getFullPageUrl(normalizedUrl)
            if (!fullUrl) {
                throw new Error(
                    `Can't get full URL for annotation to upload to Readwise`,
                )
            }
            fullPageUrls[normalizedUrl] = fullUrl
            return fullUrl
        }

        for (const change of event.info.changes) {
            if (change.collection !== 'annotations') {
                continue
            }

            if (change.type === 'create') {
                const annotation = {
                    url: change.pk as string,
                    ...change.values,
                } as Annotation

                const fullPageUrl = await getFullPageUrl(annotation.pageUrl)
                await this.actionQueue.scheduleAction(
                    {
                        type: 'post-highlights',
                        highlights: [
                            annotationToReadwise(annotation, {
                                fullPageUrl: fullPageUrl,
                            }),
                        ],
                    },
                    { queueInteraction: 'queue-and-return' },
                )
            }
        }
    }
}

function annotationToReadwise(
    annotation: Annotation,
    options: {
        fullPageUrl: string
    },
): ReadwiseHighlight {
    return {
        title: annotation.pageTitle,
        source_url: options.fullPageUrl,
        source_type: 'article',
        note: annotation.comment.length ? annotation.comment : undefined,
        location_type: 'time_offset',
        highlighted_at: annotation.createdWhen,
        highlight_url: annotation.url,
        text: annotation.body,
    }
}
