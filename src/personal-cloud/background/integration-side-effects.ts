import { BackgroundModules } from 'src/background-script/setup'
import { PersonalCloudUpdate } from '@worldbrain/memex-common/lib/personal-cloud/backend/types'

export type IntegrationUpdateType = 'create' | 'update' | 'delete'

export type IntegrationSideEffectRunner = (
    update: Omit<PersonalCloudUpdate, 'type'> & {
        type: IntegrationUpdateType
        object?: any
    },
) => Promise<void>

export const runCloudIntegrationSideEffects = (
    bgModules: Pick<BackgroundModules, 'customLists'>,
): IntegrationSideEffectRunner => async (update) => {
    if (update.collection === 'customLists') {
        await bgModules.customLists.updateListSuggestionsCache({
            added: update.type === 'create' ? update.object!.name : undefined,
            removed: update.type === 'delete' ? update.where!.name : undefined,
            updated:
                update.type === 'update'
                    ? [update.where!.name, update.object!.name]
                    : undefined,
        })
    }
}
