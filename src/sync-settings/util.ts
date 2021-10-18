import type { RemoteSyncSettingsInterface } from './background/types'
import type { SyncSettingsBackground } from './background'
import type { SyncSettingsStoreInterface } from './types'
import { BrowserSettingsStore } from 'src/util/settings'
import { FEATURE_PREFIX } from './background/constants'

export type SyncSettingsStore<
    T extends keyof SyncSettingsStoreInterface
> = Pick<SyncSettingsStoreInterface, T>

export const createSyncSettingsStore = <
    T extends keyof SyncSettingsStoreInterface
>(args: {
    syncSettingsBG: RemoteSyncSettingsInterface | SyncSettingsBackground
}): SyncSettingsStore<T> =>
    ({
        inPageUI: new BrowserSettingsStore(args.syncSettingsBG, {
            prefix: FEATURE_PREFIX.IN_PAGE_UI,
        }),
        dashboard: new BrowserSettingsStore(args.syncSettingsBG, {
            prefix: FEATURE_PREFIX.DASHBOARD,
        }),
        extension: new BrowserSettingsStore(args.syncSettingsBG, {
            prefix: FEATURE_PREFIX.EXTENSION,
        }),
        contentSharing: new BrowserSettingsStore(args.syncSettingsBG, {
            prefix: FEATURE_PREFIX.CONTENT_SHARING,
        }),
        pdfIntegration: new BrowserSettingsStore(args.syncSettingsBG, {
            prefix: FEATURE_PREFIX.PDF_INTEGRATION,
        }),
        readwise: new BrowserSettingsStore(args.syncSettingsBG, {
            prefix: FEATURE_PREFIX.READWISE,
        }),
        searchInjection: new BrowserSettingsStore(args.syncSettingsBG, {
            prefix: FEATURE_PREFIX.SEARCH_INJECTION,
        }),
    } as SyncSettingsStoreInterface)
