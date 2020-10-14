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
}

export interface ReadwiseSettingsDependencies {
    readwise: ReadwiseInterface<'caller'>
}

export type ReadwiseSettingsEvent = UIEvent<{
    toggleSyncExistingNotes: null
    setAPIKey: { key: string }
    saveAPIKey: null
    removeAPIKey: null
}>
