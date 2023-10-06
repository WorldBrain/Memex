import { UILogic, UIEventHandler } from 'ui-logic-core'
import {
    ReadwiseSettingsState,
    ReadwiseSettingsEvent,
    ReadwiseSettingsDependencies,
} from './types'
import { loadInitial, executeUITask } from 'src/util/ui-logic'

export const INITIAL_STATE: ReadwiseSettingsState = {
    loadState: 'pristine',
    keySaveState: 'pristine',
    syncState: 'pristine',
    syncExistingNotes: true,
    syncOnlyNotesWithHighlights: false,
    apiKeyEditable: false,
    apiKey: null,
}

type EventHandler<
    EventName extends keyof ReadwiseSettingsEvent
> = UIEventHandler<ReadwiseSettingsState, ReadwiseSettingsEvent, EventName>

export default class ReadwiseSettingsLogic extends UILogic<
    ReadwiseSettingsState,
    ReadwiseSettingsEvent
> {
    constructor(protected dependencies: ReadwiseSettingsDependencies) {
        super()
    }

    getInitialState(): ReadwiseSettingsState {
        return {
            ...INITIAL_STATE,
        }
    }

    init = async () => {
        await loadInitial<ReadwiseSettingsState>(this, async () => {
            const apiKey = await this.dependencies.readwise.getAPIKey()
            const onlyHighlightSyncSetting = await this.dependencies.readwise.getOnlyHighlightsSetting()
            console.log('onlyHighlightSyncSetting', onlyHighlightSyncSetting)
            const isFeatureAuthorized = await this.dependencies.checkFeatureAuthorized()
            this.emitMutation({
                apiKey: { $set: apiKey },
                syncOnlyNotesWithHighlights: { $set: onlyHighlightSyncSetting },
                apiKeyEditable: { $set: !apiKey },
                isFeatureAuthorized: { $set: isFeatureAuthorized },
            })
        })
    }

    toggleSyncExistingNotes: EventHandler<'toggleSyncExistingNotes'> = ({
        event,
    }) => {
        return { $toggle: ['syncExistingNotes'] }
    }
    toggleOnlySyncNotes: EventHandler<'toggleOnlySyncNotes'> = async ({
        event,
        previousState,
    }) => {
        await this.dependencies.readwise.setOnlyHighlightsSetting({
            setting: !previousState.syncOnlyNotesWithHighlights,
        })

        return { $toggle: ['syncOnlyNotesWithHighlights'] }
    }

    setAPIKey: EventHandler<'setAPIKey'> = async ({ event }) => {
        return { apiKey: { $set: event.key } }
    }

    saveAPIKey: EventHandler<'saveAPIKey'> = async ({ previousState }) => {
        if (!previousState.apiKey) {
            return
        }

        let keyValid = false
        await executeUITask<ReadwiseSettingsState>(
            this,
            'keySaveState',
            async () => {
                this.emitMutation({ apiKeyEditable: { $set: false } })

                const validationResult = await this.dependencies.readwise.validateAPIKey(
                    { key: previousState.apiKey },
                )
                if (!validationResult.success) {
                    this.emitMutation({ keySaveState: { $set: 'error' } })
                    this.emitMutation({
                        keySaveError: { $set: 'This API key is not valid' },
                        apiKeyEditable: { $set: true },
                    })
                    return
                }

                keyValid = true
                await this.dependencies.readwise.setAPIKey({
                    validatedKey: previousState.apiKey,
                })

                this.emitMutation({
                    apiKeyEditable: { $set: false },
                })
            },
        )

        if (!keyValid) {
            this.emitMutation({ keySaveState: { $set: 'error' } })
            return
        }

        if (previousState.syncExistingNotes) {
            await executeUITask<ReadwiseSettingsState>(
                this,
                'syncState',
                async () => {
                    await this.dependencies.readwise.uploadAllAnnotations({})
                },
            )
            return
        }
    }

    removeAPIKey: EventHandler<'removeAPIKey'> = async ({ previousState }) => {
        this.emitMutation({
            $set: {
                ...INITIAL_STATE,
            },
        })
        await this.dependencies.readwise.setAPIKey({ validatedKey: null })
        await this.init()
    }

    showSubscriptionModal: EventHandler<'showSubscriptionModal'> = () => {
        this.dependencies.showSubscriptionModal()
    }
}
