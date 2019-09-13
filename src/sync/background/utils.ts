import fromPairs from 'lodash/fromPairs'
import mapValues from 'lodash/mapValues'
import { CollectionDefinition } from '@worldbrain/storex'
import { StorageModuleCollections } from '@worldbrain/storex-pattern-modules'

export interface CollectionVersionMapEntry {
    moduleVersion: Date
    applicationVersion: Date
}
export function mapCollectionVersions(options: {
    collectionDefinitions: StorageModuleCollections
    mappings: Array<CollectionVersionMapEntry>
}) {
    const applicationVersions: {
        [moduleVersion: number]: CollectionVersionMapEntry
    } = fromPairs(
        options.mappings.map((mapping: CollectionVersionMapEntry) => [
            mapping.moduleVersion.getTime(),
            mapping,
        ]),
    )

    const minimalModuleVersion = options.mappings.reduce(
        (prev, curr) => Math.min(prev, curr.moduleVersion.getTime()),
        new Date('2100-01-01').getTime(),
    )
    const collectionVersionTimestamp = (
        collectionDefinition: CollectionDefinition,
    ) => collectionDefinition.version.getTime()
    const mapCollectionVersion = (
        collectionDefinition: CollectionDefinition,
        versionTimestamp: number,
    ) => {
        const mapping = applicationVersions[versionTimestamp]
        if (!mapping) {
            throw new Error(
                `Could not map following collection version ` +
                    collectionDefinition.name! +
                    ` to application version: ` +
                    collectionDefinition.version.toISOString(),
            )
        }

        return {
            ...collectionDefinition,
            version: mapping.applicationVersion,
        }
    }

    return mapValues(
        options.collectionDefinitions,
        latestCollectionDefinition => {
            const oldHistory = latestCollectionDefinition.history || []
            const history = oldHistory
                .map(
                    (
                        pastCollectionDefinition: CollectionDefinition,
                    ): CollectionDefinition => {
                        const pastVersionTimestamp = collectionVersionTimestamp(
                            pastCollectionDefinition,
                        )
                        if (pastVersionTimestamp < minimalModuleVersion) {
                            return null
                        }

                        return mapCollectionVersion(
                            pastCollectionDefinition,
                            pastVersionTimestamp,
                        )
                    },
                )
                .filter(entry => !!entry)

            const latestVersionTimestamp = collectionVersionTimestamp(
                latestCollectionDefinition,
            )
            return {
                ...mapCollectionVersion(
                    latestCollectionDefinition,
                    latestVersionTimestamp,
                ),
                history,
            }
        },
    )
}
