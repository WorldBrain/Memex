import StorageRegistry, { RegistryCollections } from './registry'
import {
    DexieSchema,
    CollectionDefinition,
    MigrationRunner,
    IndexType,
} from './types'

export function getDexieHistory(storageRegistry: StorageRegistry) {
    const collections = {}
    const versions: DexieSchema[] = []
    let version = 0

    Object.entries(storageRegistry.collectionsByVersion)
        .sort((left, right) => (left[0] < right[0] ? -1 : 1))
        .forEach(([versionTimestamp, defs]) => {
            defs.forEach(def => (collections[def.name] = def))
            versions.push({
                ...getDexieSchema(collections),
                version: ++version,
            })
        })

    return versions
}

function getDexieSchema(collections: RegistryCollections) {
    const schema = {}
    const migrations: MigrationRunner[] = []

    Object.entries(collections).forEach(([collectionName, collectionDef]) => {
        schema[collectionName] = collectionDef.indices
            .map(convertIndexToDexieExps(collectionDef))
            .join(', ')

        if (collectionDef.migrate && !collectionDef.migrate._seen) {
            collectionDef.migrate._seen = true // TODO: Clean this up, should have no side-effects
            migrations.push(collectionDef.migrate)
        }
    })

    return { schema, migrations }
}

/**
 * Handles converting from StorageManager index definitions to Dexie index expressions.
 */
const convertIndexToDexieExps = (def: CollectionDefinition) =>
    function(index: IndexType) {
        // Convert from StorageManager compound index to Dexie compound index
        if (index instanceof Array) {
            return `[${index[0]}+${index[1]}]`
        }

        const fieldDef = def.fields[index]
        const listPrefix = fieldDef.type === 'text' ? '*' : ''

        return `${listPrefix}${index}`
    }
