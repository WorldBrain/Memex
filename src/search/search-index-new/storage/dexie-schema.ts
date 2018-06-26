import StorageRegistry, { RegistryCollections } from './registry'
import {
    DexieSchema,
    CollectionDefinition,
    MigrationRunner,
    IndexDefinition,
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
        schema[collectionName] = convertIndexToDexieExps(collectionDef)

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
const convertIndexToDexieExps = ({ fields, indices }: CollectionDefinition) =>
    indices
        .sort(({ pk }) => (pk ? -1 : 1)) // PK indexes always come first in Dexie
        .map(indexDef => {
            // Convert from StorageManager compound index to Dexie compound index
            // Note that all other `IndexDefinition` opts are ignored for compound indexes
            if (indexDef.field instanceof Array) {
                return `[${indexDef.field[0]}+${indexDef.field[1]}]`
            }

            // Create Dexie MultiEntry index for text fields: http://dexie.org/docs/MultiEntry-Index
            // TODO: throw error if text field + PK index
            const fieldDef = fields[indexDef.field]
            let listPrefix = fieldDef.type === 'text' ? '*' : ''

            // Note that order of these statements matters
            listPrefix = indexDef.unique ? '&' : listPrefix
            listPrefix = indexDef.pk && indexDef.autoInc ? '++' : listPrefix

            return `${listPrefix}${indexDef.field}`
        })
        .join(', ')
