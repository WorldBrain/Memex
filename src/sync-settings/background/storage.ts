import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'
import type { SyncSettingValue, SyncSetting } from './types'
import { STORAGE_VERSIONS } from 'src/storage/constants'
import { COLLECTION_NAMES } from './constants'

export default class SyncSettingsStorage extends StorageModule {
    getConfig = (): StorageModuleConfig => ({
        collections: {
            [COLLECTION_NAMES.settings]: {
                version: STORAGE_VERSIONS[25].version,
                fields: {
                    key: { type: 'string' },
                    value: { type: 'json' },
                },
                indices: [{ field: 'key', pk: true }],
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
                    key: '$key:string',
                },
            },
            updateSetting: {
                operation: 'updateObject',
                collection: COLLECTION_NAMES.settings,
                args: [
                    {
                        key: '$key:string',
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
                    key: '$key:string',
                },
            },
        },
    })

    async setSetting(setting: SyncSetting): Promise<void> {
        await this.operation('createSetting', setting)
    }

    async getSetting<T extends SyncSettingValue>(
        key: string,
    ): Promise<T | null> {
        const record: SyncSetting = await this.operation('findSetting', { key })
        return (record?.value as T) ?? null
    }

    async removeSetting<T extends SyncSettingValue>(
        key: string,
    ): Promise<T | null> {
        const setting: T = await this.operation('findSetting', { key })
        if (setting) {
            await this.operation('deleteSetting', { key })
            return setting
        }
        return null
    }
}
