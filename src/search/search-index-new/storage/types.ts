import StorageRegistry from './registry'
import { Field } from './fields'
export type FieldType = 'text' | 'json' | 'datetime' | 'string' | 'url'

// TODO
export interface MigrationRunner {
    (): Promise<void>
    _seen?: boolean
}

export type CollectionDefinitions =
    | CollectionDefinition[]
    | CollectionDefinition

export interface CollectionFields {
    [fieldName: string]: CollectionField
}

export interface CollectionField {
    type: FieldType
    fieldObject?: Field
    pk?: boolean
    _index?: boolean
}

export interface CollectionDefinition {
    version: Date
    indices: string[]
    fields: CollectionFields
    migrate?: MigrationRunner
    name?: string
}

export interface RegisterableStorage {
    registerCollection(name: string, defs: CollectionDefinitions): void
}

export interface ManageableStorage extends RegisterableStorage {
    initialized: boolean
    registry: StorageRegistry
    putObject(collectionName: string, object): Promise<void>
    _finishInitialization(storage): void
}

export interface DexieSchema {
    version: number
    migrations: MigrationRunner[]
    schema: {
        [collName: string]: string
    }
}
