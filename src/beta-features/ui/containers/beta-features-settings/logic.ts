import { UILogic, UIEventHandler } from 'ui-logic-core'
import {
    BetaFeaturesSettingsState,
    BetaFeaturesSettingsEvent,
    BetaFeaturesSettingsDependencies,
} from './types'
import { loadInitial, executeUITask } from 'src/util/ui-logic'
import { runInBackground } from 'src/util/webextensionRPC'
import { SyncSettingsStoreInterface } from 'src/sync-settings/types'
import {
    SyncSettingsStore,
    createSyncSettingsStore,
} from 'src/sync-settings/util'

export const INITIAL_STATE: BetaFeaturesSettingsState = {
    betaFeaturesSetting: {},
}

type EventHandler<
    EventName extends keyof BetaFeaturesSettingsEvent
> = UIEventHandler<
    BetaFeaturesSettingsState,
    BetaFeaturesSettingsEvent,
    EventName
>

export default class BetaFeaturesSettingsLogic extends UILogic<
    BetaFeaturesSettingsState,
    BetaFeaturesSettingsEvent
> {
    syncSettings: SyncSettingsStore<'betaFeatures'>

    constructor(protected dependencies: BetaFeaturesSettingsDependencies) {
        super()

        this.syncSettings = createSyncSettingsStore({
            syncSettingsBG: dependencies.syncSettingsBG,
        })
    }

    getInitialState(): BetaFeaturesSettingsState {
        return {
            ...INITIAL_STATE,
        }
    }

    init = async () => {
        // Load feature settings
        const imageOverlaySetting = await this.syncSettings.betaFeatures.get(
            'imageOverlay',
        )

        let betaFeaturesSetting = {
            imageOverlay: imageOverlaySetting,
        }

        this.emitMutation({
            betaFeaturesSetting: { $set: betaFeaturesSetting },
        })
    }

    activateFeature: EventHandler<'activateFeature'> = async ({
        event,
        previousState,
    }) => {
        let betaFeaturesSetting = previousState.betaFeaturesSetting
        const feature = event.feature
        const previousValue = betaFeaturesSetting[feature]
        betaFeaturesSetting[feature] = !previousValue

        await this.syncSettings.betaFeatures.set(feature, !previousValue)

        this.emitMutation({
            betaFeaturesSetting: { $set: betaFeaturesSetting },
        })
    }
}
