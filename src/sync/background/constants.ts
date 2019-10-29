import {
    ContinuousSyncSetting,
    ContinuousSyncSettingValue,
} from '@worldbrain/storex-sync/lib/integration/continuous-sync'

export const SYNC_STORAGE_AREA_KEYS: {
    [Key in ContinuousSyncSetting | 'encryptionKey']: string
} = {
    continuousSyncEnabled: 'enable-continuous-sync',
    deviceId: 'device-id',
    encryptionKey: 'sync-encryption-key',
}

export const INCREMENTAL_SYNC_FREQUENCY = 1000 * 60 * 60 * 15 // 15 minutes
