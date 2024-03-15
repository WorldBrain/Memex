import { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import {
    UIEvent,
    UISignal,
} from '../../../../external/@worldbrain/memex-common/ts/main-ui/classes/logic'

export interface PromptTemplatesDependencies {
    syncSettingsBG: RemoteSyncSettingsInterface
    onTemplateSelect: (text: string) => void
    getRootElement: () => HTMLElement
}

export interface PromptTemplatesState {
    promptTemplatesArray: PromptTemplate[]
    editValue: string
}

export type PromptTemplatesEvent = UIEvent<{
    selectTemplate: { id: number }
    focusTemplate: { id: number }
    setTemplateEdit: { id: number; value: string }
    saveEditTemplate: { id: number; text: string }
    startNewTemplate: { text: string }
    deleteTemplate: { id: number }
    reorderTemplates: { oldIndex: number; newIndex: number }
}>

export type PromptTemplatesSignal = UISignal<{ type: 'nothing-yet' }>

export type PromptTemplate = {
    text: string
    isEditing?: string
    isFocused?: boolean
}
