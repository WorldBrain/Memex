import { CollectionDefinition } from '../../search/storage'

export function isExcludedFromBackup(collection: CollectionDefinition) {
    return collection.backup === false
}
