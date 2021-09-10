import type {
    RemoteSettingsInterface,
    UserSettingsByFeature,
} from '../background/types'
import { BrowserSettingsStore } from 'src/util/settings'
import { FEATURE_PREFIX } from '../background/constants'

export interface UISyncSettings {
    inPageUI: BrowserSettingsStore<UserSettingsByFeature['inPageUI']>
    dashboard: BrowserSettingsStore<UserSettingsByFeature['dashboard']>
    extension: BrowserSettingsStore<UserSettingsByFeature['extension']>
    contentSharing: BrowserSettingsStore<
        UserSettingsByFeature['contentSharing']
    >
    pdfIntegration: BrowserSettingsStore<
        UserSettingsByFeature['pdfIntegration']
    >
    searchInjection: BrowserSettingsStore<
        UserSettingsByFeature['searchInjection']
    >
}

export const createUISyncSettings = <T extends keyof UISyncSettings>(args: {
    syncSettingsBG: RemoteSettingsInterface
}): Pick<UISyncSettings, T> =>
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
    } as UISyncSettings)
