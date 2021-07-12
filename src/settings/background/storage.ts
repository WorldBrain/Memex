import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'
import type { SettingValue, Setting } from './types'
import { STORAGE_VERSIONS } from 'src/storage/constants'
import { COLLECTION_NAMES } from './constants'

export default class SettingsStorage extends StorageModule {
    getConfig = (): StorageModuleConfig => ({
        collections: {
            [COLLECTION_NAMES.settings]: {
                version: STORAGE_VERSIONS[20].version,
                fields: {
                    name: { type: 'string' },
                    value: { type: 'json' },
                },
                indices: [{ field: 'name', pk: true }],
            },
        },
        operations: {
            createSetting: {
                operation: 'createObject',
                collection: COLLECTION_NAMES.settings,
            },
            findSetting: {
                operation: 'findObject',
                collection: COLLECTION_NAMES.settings,
                args: {
                    name: '$name:string',
                },
            },
            updateSetting: {
                operation: 'updateObject',
                collection: COLLECTION_NAMES.settings,
                args: [
                    {
                        name: '$name:string',
                    },
                    {
                        value: '$value:json',
                    },
                ],
            },
            deleteSetting: {
                operation: 'deleteObject',
                collection: COLLECTION_NAMES.settings,
                args: {
                    name: '$name:string',
                },
            },
        },
    })

    async setSetting(setting: Setting): Promise<void> {
        await this.operation('createSetting', setting)
    }

    async getSetting<T extends SettingValue>(name: string): Promise<T> {
        const record: Setting = await this.operation('findSetting', { name })
        return record.value as T
    }

    async removeSetting<T extends SettingValue>(name: string): Promise<T> {
        const setting = await this.operation('findSetting', { name })
        await this.operation('deleteSetting', { name })
        return setting
    }
}
