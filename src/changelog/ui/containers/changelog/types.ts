import { UIEvent } from 'ui-logic-core'
import {
    RemoteSyncSettingsInterface,
    SyncSettingsByFeature,
} from 'src/sync-settings/background/types'
import { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import { TaskState } from 'ui-logic-core/lib/types'

export interface ChangelogState {
    urlToUseForIframe?: string
    iframeLoading?: TaskState
}

export interface ChangelogDependencies {
    authBG: AuthRemoteFunctionsInterface
    mode: 'feedback' | 'changelog'
}

export type ChangelogEvent = UIEvent<{}>
