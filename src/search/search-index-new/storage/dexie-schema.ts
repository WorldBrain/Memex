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

    return patchDirectLinksSchema(versions)
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

            // Create Dexie MultiEntry index for indexed text fields: http://dexie.org/docs/MultiEntry-Index
            // TODO: throw error if text field + PK index
            if (fields[indexDef.field].type === 'text') {
                const fullTextField =
                    indexDef.fullTextIndexName ||
                    StorageRegistry.createTermsIndex(indexDef.field)
                return `*${fullTextField}`
            }

            // Note that order of these statements matters
            let listPrefix = indexDef.unique ? '&' : ''
            listPrefix = indexDef.pk && indexDef.autoInc ? '++' : listPrefix

            return `${listPrefix}${indexDef.field}`
        })
        .join(', ')

/**
 * Takes the generated schema versions, based on the registed collections, and finds the
 * first one in which `directLinks` schema was added, then generates a "patch" schema.
 * This "patch" schema should contain the incorrect indexes that was accidently rolled out
 * to users at the release of our Direct Links feature. This should ensure Dexie knows about
 * both the incorrect indexes and how to drop those to migrate to the correct indexes.
 */
function patchDirectLinksSchema(schemaVersions: DexieSchema[]): DexieSchema[] {
    const firstAppears = schemaVersions.findIndex(
        ({ schema }) => schema.directLinks != null,
    )

    // Return schemas as-is if direct links schema not found (tests)
    if (firstAppears === -1) {
        return schemaVersions
    }

    const preceding = schemaVersions[firstAppears - 1]

    const patchedSchema = {
        schema: {
            ...preceding.schema,
            directLinks: 'url, *pageTitle, *body, createdWhen',
        },
        migrations: [],
        version: preceding.version + 1,
    }

    return [
        ...schemaVersions.slice(0, firstAppears),
        // Shim the schema with the incorrect indexes, so Dexie knows about its existence
        patchedSchema,
        // All subsequent schemas need to be 1 version higher to take the incorrect index schema into account
        ...schemaVersions
            .slice(firstAppears)
            .map(schema => ({ ...schema, version: schema.version + 1 })),
    ]
}
