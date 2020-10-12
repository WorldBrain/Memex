import MemoryBrowserStorage, {
    LimitedBrowserStorage,
} from 'src/util/tests/browser-storage'
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
import { string } from 'prop-types'

export class ReadwiseBackground {
    mostRecentResponse?: ReadwiseResponse
    settingsStore: SettingStore<ReadwiseSettings>
    readwiseAPI: ReadwiseAPI
    _apiKeyLoaded = false
    _apiKey?: string

    constructor(
        private options: {
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

    async scheduleAction(action: ReadwiseAction) {
        await this.executeAction(action)
    }

    async executeAction(action: ReadwiseAction) {
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
                await this.scheduleAction({
                    type: 'post-highlights',
                    highlights: [
                        annotationToReadwise(annotation, {
                            fullPageUrl: fullPageUrl,
                        }),
                    ],
                })
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
