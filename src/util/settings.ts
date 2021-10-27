import type { LimitedBrowserStorage } from './tests/browser-storage'

export interface SettingStore<Settings> {
    set<Key extends keyof Settings>(
        key: Key,
        value: Settings[Key],
    ): Promise<void>
    get<Key extends keyof Settings>(key: Key): Promise<Settings[Key] | null>
}

export class BrowserSettingsStore<Settings> implements SettingStore<Settings> {
    constructor(
        private localBrowserStorage: LimitedBrowserStorage,
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

    async get<Key extends keyof Settings>(
        key: Key,
    ): Promise<Settings[Key] | null> {
        const storageKey = this._makeStorageKey(key as string)
        return this.__rawGet(storageKey)
    }

    async __rawGet<ReturnType = any>(key: string): Promise<ReturnType | null> {
        const response = await this.localBrowserStorage.get(key)
        return (response[key] as ReturnType) ?? null
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
