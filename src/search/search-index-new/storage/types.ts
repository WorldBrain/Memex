import { FilterQuery as MongoFilterQuery } from 'mongodb'

import StorageRegistry from './registry'
import { Field } from './fields'

export type FieldType = 'text' | 'json' | 'datetime' | 'string' | 'url'

// TODO
export interface MigrationRunner {
    (): Promise<void>
    _seen?: boolean
}

export interface FindOpts {
    reverse?: boolean
    skip?: number
    limit?: number
}

export type FilterQuery<T> = MongoFilterQuery<T>

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
    findObject<T>(
        collectionName: string,
        filter: FilterQuery<T>,
        opts?: FindOpts,
    ): Promise<T>
    findAll<T>(
        collectionName: string,
        filter: FilterQuery<T>,
        opts?: FindOpts,
    ): Promise<T[]>
    countAll<T>(collectionName: string, filter: FilterQuery<T>): Promise<number>
    deleteObject<T>(
        collectionName: string,
        filter: FilterQuery<T>,
    ): Promise<number>
    updateObject<T>(
        collectionName: string,
        filter: FilterQuery<T>,
        update,
    ): Promise<number>
    _finishInitialization(storage): void
}

export interface DexieSchema {
    version: number
    migrations: MigrationRunner[]
    schema: {
        [collName: string]: string
    }
}
