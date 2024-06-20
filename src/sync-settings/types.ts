import type { SettingStore } from 'src/util/settings'
import type { SyncSettingsByFeature } from './background/types'

export interface SyncSettingsStoreInterface {
    readwise: SettingStore<SyncSettingsByFeature['readwise']>
    inPageUI: SettingStore<SyncSettingsByFeature['inPageUI']>
    dashboard: SettingStore<SyncSettingsByFeature['dashboard']>
    extension: SettingStore<SyncSettingsByFeature['extension']>
    contentSharing: SettingStore<SyncSettingsByFeature['contentSharing']>
    pdfIntegration: SettingStore<SyncSettingsByFeature['pdfIntegration']>
    searchInjection: SettingStore<SyncSettingsByFeature['searchInjection']>
    activityIndicator: SettingStore<SyncSettingsByFeature['activityIndicator']>
    openAI: SettingStore<SyncSettingsByFeature['openAI']>
    highlightColors: SettingStore<SyncSettingsByFeature['highlightColors']>
    betaFeatures: SettingStore<SyncSettingsByFeature['betaFeatures']>
}
