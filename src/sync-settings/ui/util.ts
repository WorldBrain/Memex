import type {
    RemoteSyncSettingsInterface,
    SyncSettingsByFeature,
} from '../background/types'
import { BrowserSettingsStore } from 'src/util/settings'
import { FEATURE_PREFIX } from '../background/constants'

export type UISyncSettings<T extends keyof SyncSettings> = Pick<SyncSettings, T>

export interface SyncSettings {
    inPageUI: BrowserSettingsStore<SyncSettingsByFeature['inPageUI']>
    dashboard: BrowserSettingsStore<SyncSettingsByFeature['dashboard']>
    extension: BrowserSettingsStore<SyncSettingsByFeature['extension']>
    contentSharing: BrowserSettingsStore<
        SyncSettingsByFeature['contentSharing']
    >
    pdfIntegration: BrowserSettingsStore<
        SyncSettingsByFeature['pdfIntegration']
    >
    searchInjection: BrowserSettingsStore<
        SyncSettingsByFeature['searchInjection']
    >
}

export const createUISyncSettings = <T extends keyof SyncSettings>(args: {
    syncSettingsBG: RemoteSyncSettingsInterface
}): UISyncSettings<T> =>
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
        searchInjection: new BrowserSettingsStore(args.syncSettingsBG, {
            prefix: FEATURE_PREFIX.SEARCH_INJECTION,
        }),
    } as SyncSettings)
