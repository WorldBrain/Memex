import { Browser } from 'webextension-polyfill-ts'
import { MemexSyncSettingsStore } from '@worldbrain/memex-common/lib/sync/settings'
import { MemexSyncSetting } from '@worldbrain/memex-common/lib/sync/types'
import { SYNC_STORAGE_AREA_KEYS } from '@worldbrain/memex-common/lib/sync/constants'
import { getLocalStorage } from 'src/util/storage'

export class MemexExtSyncSettingStore implements MemexSyncSettingsStore {
    constructor(
        private options: {
            browserAPIs: Pick<Browser, 'storage'>
        },
    ) {}

    async retrieveSetting(key: MemexSyncSetting) {
        const localStorage = this.options.browserAPIs.storage.local
        return getLocalStorage(SYNC_STORAGE_AREA_KEYS[key], null, localStorage)
    }

    async storeSetting(
        key: MemexSyncSetting,
        value: boolean | number | string | null,
    ) {
        const localStorage = this.options.browserAPIs.storage.local
        await localStorage.set({
            [SYNC_STORAGE_AREA_KEYS[key]]: value,
        })
    }
}
