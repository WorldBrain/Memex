import { UIEvent } from 'ui-logic-core'
import { SyncSettingsStoreInterface } from 'src/sync-settings/types'

export interface BetaFeaturesSettingsState {
    betaFeaturesSetting: {
        [feature: string]: boolean
    } | null
}

export interface BetaFeaturesSettingsDependencies {
    syncSettingsBG: SyncSettingsStoreInterface
}

export type BetaFeaturesSettingsEvent = UIEvent<{
    activateFeature: { feature: string }
}>
