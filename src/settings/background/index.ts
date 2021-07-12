import StorageManager from '@worldbrain/storex'
import type { LimitedBrowserStorage } from 'src/util/tests/browser-storage'
import type { SettingValue, RemoteSettingsInterface } from './types'
import SettingsStorage from './storage'

export interface Dependencies {
    storageManager: StorageManager
}

export class UserSettingsBackground implements LimitedBrowserStorage {
    storage: SettingsStorage
    remoteFunctions: RemoteSettingsInterface

    constructor(options: Dependencies) {
        this.storage = new SettingsStorage({
            storageManager: options.storageManager,
        })
        this.remoteFunctions = {
            remove: this.remove,
            get: this.get,
            set: this.set,
        }
    }

    private static formatKeyValsTuplesToDict = (
        keyVals: [string, SettingValue][],
    ): { [key: string]: SettingValue } => {
        const storage = {}
        for (const [key, value] of keyVals) {
            storage[key as string] = value
        }
        return storage
    }

    get: LimitedBrowserStorage['get'] = async (names) => {
        if (typeof names === 'string') {
            const value = await this.storage.getSetting(names)

            return { [names]: value }
        } else if (Array.isArray(names)) {
            const keyVals = (await Promise.all(
                names.map(async (name) => [
                    name,
                    await this.storage.getSetting(name),
                ]),
            )) as Array<[string, SettingValue]>
            return UserSettingsBackground.formatKeyValsTuplesToDict(keyVals)
        }

        const keyVals = (await Promise.all(
            Object.keys(names).map(async (name) => [
                name,
                await this.storage.getSetting(name),
            ]),
        )) as Array<[string, SettingValue]>

        return UserSettingsBackground.formatKeyValsTuplesToDict(keyVals)
    }

    set: LimitedBrowserStorage['set'] = async (items) => {
        await Promise.all(
            Object.entries(items).map(([name, value]) =>
                this.storage.setSetting({ name, value }),
            ),
        )
    }

    remove: LimitedBrowserStorage['remove'] = async (names) => {
        if (typeof names === 'string') {
            await this.storage.removeSetting(names)
        } else {
            await Promise.all(
                names.map(async (name) => [
                    name,
                    await this.storage.removeSetting(name),
                ]),
            )
        }
    }
}
