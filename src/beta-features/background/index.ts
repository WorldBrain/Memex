import { BetaFeatureInterface } from './types/remote-interface'
import { registerRemoteFunctions } from 'src/util/webextensionRPC'
import { SyncSettingsStoreInterface } from 'src/sync-settings/types'

export class BetaFeaturesBackground {
    remoteFunctions: BetaFeatureInterface<'provider'>

    constructor(
        private options: {
            settingsStore: SyncSettingsStoreInterface
        },
    ) {
        this.remoteFunctions = {
            // validateAPIKey: remoteFunctionWithoutExtraArgs(this.validateAPIKey),
        }
    }

    setupRemoteFunctions() {
        registerRemoteFunctions(this.remoteFunctions)
    }
}
