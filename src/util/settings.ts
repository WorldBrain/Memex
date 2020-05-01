import { Storage } from 'webextension-polyfill-ts'

export interface SettingStore<Settings> {
    set<Key extends keyof Settings>(
        key: Key,
        value: Settings[Key],
    ): Promise<void>
    get<Key extends keyof Settings>(key: Key): Promise<Settings[Key]>
}

export class BrowserSettingsStore<Settings> implements SettingStore<Settings> {
    constructor(
        private localBrowserStorage: Storage.LocalStorageArea,
        private options?: {
            prefix?: string
        },
    ) {}

    async set<Key extends keyof Settings>(
        key: Key,
        value: Settings[Key],
    ): Promise<void> {
        const storageKey = this._makeStorageKey(key as string)
        await this.localBrowserStorage.set({ [storageKey]: value })
    }

    async get<Key extends keyof Settings>(key: Key): Promise<Settings[Key]> {
        const storageKey = this._makeStorageKey(key as string)
        const response = await this.localBrowserStorage.get(
            storageKey as string,
        )
        return response[storageKey as string]
    }

    _makeStorageKey(key: string) {
        return (this.options?.prefix ?? '') + key
    }
}

export class MemorySettingStore<Settings> implements SettingStore<Settings> {
    settings: { [Key in keyof Settings]?: Settings[Key] } = {}

    async set<Key extends keyof Settings>(
        key: Key,
        value: Settings[Key],
    ): Promise<void> {
        this.settings[key] = value
    }

    async get<Key extends keyof Settings>(key: Key): Promise<Settings[Key]> {
        return this.settings[key]
    }
}
