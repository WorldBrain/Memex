import { DexieSchema } from '@worldbrain/storex-backend-dexie/lib/types'
import browserIsChrome from 'src/util/check-browser'

/**
 * Takes the generated schema versions, based on the registed collections, and finds the
 * first one in which `directLinks` schema was added, then generates a "patch" schema.
 * This "patch" schema should contain the incorrect indexes that was accidently rolled out
 * to users at the release of our Direct Links feature. This should ensure Dexie knows about
 * both the incorrect indexes and how to drop those to migrate to the correct indexes.
 */
export const initPatchSchema = (isChrome: boolean) => (
    schemaVersions: DexieSchema[],
): any[] => {
    const directLinksFirstAppears = schemaVersions.findIndex(
        ({ schema }) => schema.directLinks != null,
    )
    const syncFirstAppears = schemaVersions.findIndex(
        ({ schema }) => schema.clientSyncLogEntry != null,
    )

    // Return schemas as-is if direct links/sync schema not found (tests)
    if (directLinksFirstAppears === -1 || syncFirstAppears === -1) {
        return schemaVersions
    }

    const precedingDirectLinks = schemaVersions[directLinksFirstAppears - 1]
    const patchedDirectLinksSchema: DexieSchema = {
        ...precedingDirectLinks,
        schema: {
            ...precedingDirectLinks.schema,
            directLinks: 'url, *pageTitle, *body, createdWhen',
        },
    }

    const schemasBeforeSync = [
        ...schemaVersions.slice(0, directLinksFirstAppears),
        // Shim the schema with the incorrect indexes, so Dexie knows about its existence
        ...[
            patchedDirectLinksSchema,
            ...schemaVersions.slice(directLinksFirstAppears, syncFirstAppears),
        ].map(schema => ({
            ...schema,
            dexieSchemaVersion: schema.dexieSchemaVersion + 1,
        })),
    ]

    if (isChrome) {
        return [
            ...schemasBeforeSync,
            ...schemaVersions.slice(syncFirstAppears).map(schema => ({
                ...schema,
                dexieSchemaVersion: schema.dexieSchemaVersion + 1,
            })),
        ]
    }

    const precedingSync = schemaVersions[syncFirstAppears - 1]
    const missingPreSyncSchema: DexieSchema = {
        ...precedingSync,
        schema: precedingSync.schema,
    }

    return [
        ...schemasBeforeSync,
        // Shim the missing pre-sync schema, so Dexie knows about its existence
        ...[
            missingPreSyncSchema,
            ...schemaVersions.slice(syncFirstAppears),
        ].map(schema => ({
            ...schema,
            dexieSchemaVersion: schema.dexieSchemaVersion + 2,
        })),
    ]
}

const patchSchema = initPatchSchema(browserIsChrome())

export default patchSchema
