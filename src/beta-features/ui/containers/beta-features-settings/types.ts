import { UIEvent } from 'ui-logic-core'
import {
    RemoteSyncSettingsInterface,
    SyncSettingsByFeature,
} from 'src/sync-settings/background/types'

export interface BetaFeaturesSettingsState {
    betaFeaturesSetting: {
        [feature: string]: boolean
    } | null
}

export interface BetaFeaturesSettingsDependencies {
    syncSettingsBG: RemoteSyncSettingsInterface
}

export type BetaFeaturesSettingsEvent = UIEvent<{
    activateFeature: { feature: keyof SyncSettingsByFeature['betaFeatures'] }
}>
