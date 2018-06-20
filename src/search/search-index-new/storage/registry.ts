import {
    RegisterableStorage,
    CollectionDefinitions,
    CollectionDefinition,
    IndexType,
} from './types'
import FIELD_TYPES from './fields'

export interface RegistryCollections {
    [collName: string]: CollectionDefinition
}

export interface RegistryCollectionsVersionMap {
    [collVersion: number]: CollectionDefinition[]
}

export default class StorageRegistry implements RegisterableStorage {
    public collections: RegistryCollections = {}
    public collectionsByVersion: RegistryCollectionsVersionMap = {}

    /**
     * Handles mutating a collection's definition to flag all fields that are declared to be
     * indexable as indexed fields.
     */
    private static _registerIndexedFields = (def: CollectionDefinition) => {
        const flagField = (fieldName: string) =>
            (def.fields[fieldName]._index = true)

        return function(index: IndexType) {
            // Compound indexes need to flag all specified fields
            if (index instanceof Array) {
                index.forEach(flagField)
            } else {
                flagField(index)
            }
        }
    }

    registerCollection(name: string, defs: CollectionDefinitions) {
        if (!(defs instanceof Array)) {
            defs = [defs]
        }

        defs.sort(def => def.version.getTime()).forEach(def => {
            this.collections[name] = def
            def.name = name

            const fields = def.fields
            Object.entries(fields).forEach(([fieldName, fieldDef]) => {
                const FieldClass = FIELD_TYPES[fieldDef.type]
                if (FieldClass) {
                    fieldDef.fieldObject = new FieldClass(fieldDef)
                }
            })

            const indices = def.indices || []
            indices.forEach(StorageRegistry._registerIndexedFields(def))

            const version = def.version.getTime()
            this.collectionsByVersion[version] =
                this.collectionsByVersion[version] || []
            this.collectionsByVersion[version].push(def)
        })
    }
}
