import {
    SyncSettingsStore,
    createSyncSettingsStore,
} from 'src/sync-settings/util'
import {
    PromptTemplatesEvent,
    PromptTemplatesDependencies,
    PromptTemplatesState,
    PromptTemplate,
} from './types'
import { UIEventHandler, UILogic } from 'ui-logic-core'
import { AI_PROMPT_DEFAULTS } from 'src/sidebar/annotations-sidebar/constants'
import { marked } from 'marked'

type EventHandler<
    EventName extends keyof PromptTemplatesEvent
> = UIEventHandler<PromptTemplatesState, PromptTemplatesEvent, EventName>

export default class PromptTemplatesLogic extends UILogic<
    PromptTemplatesState,
    PromptTemplatesEvent
> {
    private syncSettings: SyncSettingsStore<'openAI'>

    constructor(private dependencies: PromptTemplatesDependencies) {
        super()
    }

    init: EventHandler<'init'> = async () => {
        this.syncSettings = createSyncSettingsStore({
            syncSettingsBG: this.dependencies.syncSettingsBG,
        })
        let promptTemplateArray =
            (await this.syncSettings.openAI?.get('promptSuggestions')) ??
            AI_PROMPT_DEFAULTS.map((text) => ({
                text,
                isEditing: null,
                isFocused: false,
            }))

        if (promptTemplateArray[0].text == null) {
            promptTemplateArray =
                promptTemplateArray?.map((text) => ({
                    text,
                    isEditing: null,
                    isFocused: false,
                })) ??
                AI_PROMPT_DEFAULTS.map((text) => ({
                    text,
                    isEditing: null,
                    isFocused: false,
                }))
        }

        this.emitMutation({
            promptTemplatesArray: { $set: promptTemplateArray },
        })
        this.getInitialState()
    }

    getInitialState(): PromptTemplatesState {
        return {
            promptTemplatesArray: [],
            editValue: null,
        }
    }

    focusTemplate: EventHandler<'selectTemplate'> = async ({
        event,
        previousState,
    }) => {
        const templateToFocus = event.id
        const currentTemplates = previousState.promptTemplatesArray

        const updatedTemplates = currentTemplates?.map((template, index) => {
            if (index === templateToFocus) {
                return { ...template, isFocused: true }
            }
            if (index !== templateToFocus) {
                return { ...template, isFocused: false }
            }
            return template
        })
        this.emitMutation({
            promptTemplatesArray: { $set: updatedTemplates },
        })
    }

    selectTemplate: EventHandler<'selectTemplate'> = async ({
        event,
        previousState,
    }) => {
        const selectedTemplate = event.id

        const currentTemplates = previousState.promptTemplatesArray

        this.dependencies.onTemplateSelect(
            marked.parse(currentTemplates[selectedTemplate].text),
        )
    }
    setTemplateEdit: EventHandler<'setTemplateEdit'> = async ({
        event,
        previousState,
    }) => {
        const selectedTemplate = event.id
        const currentTemplates = previousState.promptTemplatesArray
        const editValue =
            event.value || currentTemplates[selectedTemplate]?.text

        if (currentTemplates[selectedTemplate]) {
            currentTemplates[selectedTemplate] = {
                ...currentTemplates[selectedTemplate],
                isEditing: editValue,
            }

            this.emitMutation({
                promptTemplatesArray: { $set: currentTemplates },
                editValue: { $set: editValue },
            })
        }
    }

    saveEditTemplate: EventHandler<'saveEditTemplate'> = async ({
        event,
        previousState,
    }) => {
        if (event.text.length === 0) {
            return
        }
        const id = event.id
        const changedText = event.text
        const currentTemplates = previousState.promptTemplatesArray

        const newTemplate: PromptTemplate = {
            text: changedText,
            isEditing: null,
        }

        const updatedTemplates = [...currentTemplates]
        updatedTemplates[id] = newTemplate

        this.emitMutation({
            promptTemplatesArray: {
                $set: updatedTemplates.map(({ text }) => ({ text })),
            },
            editValue: { $set: null },
        })
        await this.syncSettings.openAI.set(
            'promptSuggestions',
            updatedTemplates,
        )
    }
    startNewTemplate: EventHandler<'startNewTemplate'> = async ({
        event,
        previousState,
    }) => {
        const currentTemplates = previousState.promptTemplatesArray

        const newTemplate: PromptTemplate = {
            text: '',
            isEditing: '',
            isFocused: true,
        }

        const updatedTemplates = [newTemplate, ...currentTemplates]

        this.emitMutation({
            promptTemplatesArray: { $set: updatedTemplates },
        })
    }

    confirmDelete = true
    deleteTemplate: EventHandler<'deleteTemplate'> = async ({
        event,
        previousState,
    }) => {
        const templateIdToDelete = event.id
        const currentTemplates = previousState.promptTemplatesArray

        // Filter out the template to delete
        const updatedTemplates = currentTemplates.filter(
            (_, index) => index !== templateIdToDelete,
        )

        this.emitMutation({
            promptTemplatesArray: { $set: updatedTemplates },
        })

        // Save the updated list of templates
        await this.syncSettings.openAI.set(
            'promptSuggestions',
            updatedTemplates,
        )
    }
    reorderTemplates: EventHandler<'reorderTemplates'> = async ({
        event,
        previousState,
    }) => {
        const { oldIndex, newIndex } = event
        const currentTemplates = previousState.promptTemplatesArray

        let updatedTemplates = [...currentTemplates]
        // Remove or move the element
        const [removed] = updatedTemplates.splice(oldIndex, 1)
        updatedTemplates.splice(newIndex, 0, removed)

        // Transform updatedTemplates to only include the text property
        const templatesTextOnly = updatedTemplates.map(({ text }) => ({ text }))

        this.emitMutation({
            promptTemplatesArray: {
                $set: templatesTextOnly,
            },
        })

        await this.syncSettings.openAI.set(
            'promptSuggestions',
            templatesTextOnly,
        )
    }
}
