import { UIEvent } from 'ui-logic-core'
import { TaskState } from 'ui-logic-core/lib/types'
import { ReadwiseInterface } from 'src/readwise-integration/background/types/remote-interface'

export interface ReadwiseSettingsState {
    loadState: TaskState
    syncState: TaskState
    keySaveState: TaskState
    keySaveError?: string
    apiKey?: string
    apiKeyEditable: boolean
    syncExistingNotes?: boolean
    isFeatureAuthorized?: boolean
}

export interface ReadwiseSettingsDependencies {
    readwise: ReadwiseInterface<'caller'>
    checkFeatureAuthorized(): Promise<boolean>
    showSubscriptionModal: () => void
}

export type ReadwiseSettingsEvent = UIEvent<{
    toggleSyncExistingNotes: null
    setAPIKey: { key: string }
    saveAPIKey: null
    removeAPIKey: null
    showSubscriptionModal: null
}>
