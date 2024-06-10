import { UILogic, UIEventHandler } from 'ui-logic-core'
import {
    BetaFeaturesSettingsState,
    BetaFeaturesSettingsEvent,
    BetaFeaturesSettingsDependencies,
} from './types'
import { loadInitial, executeUITask } from 'src/util/ui-logic'
import { runInBackground } from 'src/util/webextensionRPC'
import { SyncSettingsStoreInterface } from 'src/sync-settings/types'

export const INITIAL_STATE: BetaFeaturesSettingsState = {
    betaFeaturesSetting: null,
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
    private syncSettingsBG = runInBackground<SyncSettingsStoreInterface>()

    constructor(protected dependencies: BetaFeaturesSettingsDependencies) {
        super()
    }

    getInitialState(): BetaFeaturesSettingsState {
        return {
            ...INITIAL_STATE,
        }
    }

    init = async () => {
        // await loadInitial<BetaFeaturesSettingsState>(this, async () => {})
    }

    activateFeature: EventHandler<'activateFeature'> = async ({
        event,
        previousState,
    }) => {
        let betaFeaturesSetting = previousState.betaFeaturesSetting
        const feature = event.feature
        const previousValue = betaFeaturesSetting[feature]

        await this.dependencies.syncSettingsBG.extension.set('betaFeatures', {
            [feature]: !previousValue,
        })

        betaFeaturesSetting[feature] = true

        this.emitMutation({
            betaFeaturesSetting: { $set: betaFeaturesSetting },
        })
    }
}
