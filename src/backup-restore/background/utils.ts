import { CollectionDefinition } from '@worldbrain/storex/ts/types'

export function isExcludedFromBackup(collection: CollectionDefinition) {
    return collection.backup === false
}
