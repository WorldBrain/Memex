/**
 * Takes the generated schema versions, based on the registed collections, and finds the
 * first one in which `directLinks` schema was added, then generates a "patch" schema.
 * This "patch" schema should contain the incorrect indexes that was accidently rolled out
 * to users at the release of our Direct Links feature. This should ensure Dexie knows about
 * both the incorrect indexes and how to drop those to migrate to the correct indexes.
 */
export default function patchDirectLinksSchema(schemaVersions: any[]): any[] {
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
