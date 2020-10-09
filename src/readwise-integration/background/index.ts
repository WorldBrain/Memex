import MemoryBrowserStorage, {
    LimitedBrowserStorage,
} from 'src/util/tests/browser-storage'
import { ReadwiseResponse, ReadwiseSettings, ReadwiseAPI } from './types'
import { HTTPReadwiseAPI } from './readwise-api'
import { SettingStore, BrowserSettingsStore } from 'src/util/settings'
import { StorageOperationEvent } from '@worldbrain/storex-middleware-change-watcher/lib/types'

export class ReadwiseBackground {
    mostRecentResponse?: ReadwiseResponse
    settingsStore: SettingStore<ReadwiseSettings>
    readwiseAPI: ReadwiseAPI
    _apiKeyLoaded = false
    _apiKey?: string

    constructor(
        private options: {
            browserStorage: LimitedBrowserStorage
        },
    ) {
        this.settingsStore = new BrowserSettingsStore<ReadwiseSettings>(
            options.browserStorage,
            {
                prefix: 'readwise.',
            },
        )
        this.readwiseAPI = new HTTPReadwiseAPI()
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
    async handlePostStorageChange(
        event: StorageOperationEvent<'post'>,
        options: {
            source: 'sync' | 'local'
        },
    ) {
        // if (!this._apiKey)
        console.log(event.info.changes)
    }
}
