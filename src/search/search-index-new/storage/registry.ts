import {
    RegisterableStorage,
    CollectionDefinitions,
    CollectionDefinition,
    IndexDefinition,
} from './types'
import FIELD_TYPES from './fields'

export interface RegistryCollections {
    [collName: string]: CollectionDefinition
}

export interface RegistryCollectionsVersionMap {
    [collVersion: number]: CollectionDefinition[]
}

export default class StorageRegistry implements RegisterableStorage {
    public static createTermsIndex = (fieldName: string) =>
        `_${fieldName}_terms`

    public collections: RegistryCollections = {}
    public collectionsByVersion: RegistryCollectionsVersionMap = {}

    /**
     * Handles mutating a collection's definition to flag all fields that are declared to be
     * indexable as indexed fields.
     */
    private static _registerIndexedFields(def: CollectionDefinition) {
        const flagField = (indexDefIdx: number) => (fieldName: string) =>
            (def.fields[fieldName]._index = indexDefIdx)

        const indices = def.indices || []
        indices.forEach(({ field }, i) => {
            // Compound indexes need to flag all specified fields
            if (field instanceof Array) {
                field.forEach(flagField(i))
            } else {
                flagField(i)(field)
            }
        })
    }

    registerCollection(name: string, defs: CollectionDefinitions) {
        if (!(defs instanceof Array)) {
            defs = [defs]
        }

        defs.sort(def => def.version.getTime()).forEach(def => {
            this.collections[name] = def
            def.name = name
            const fields = def.fields
            Object.entries(fields).forEach(([, fieldDef]) => {
                const FieldClass = FIELD_TYPES[fieldDef.type]

                if (FieldClass) {
                    fieldDef.fieldObject = new FieldClass(fieldDef)
                }
            })

            StorageRegistry._registerIndexedFields(def)

            const version = def.version.getTime()
            this.collectionsByVersion[version] =
                this.collectionsByVersion[version] || []
            this.collectionsByVersion[version].push(def)
        })
    }
}
