import { FilterQuery as MongoFilterQuery } from 'mongodb'

import StorageRegistry from './registry'
import { Field } from './fields'

export type FieldType =
    | 'text'
    | 'json'
    | 'datetime'
    | 'timestamp'
    | 'string'
    | 'url'
    | 'int'
    | 'float'
    | 'blob'
    | 'bool'

// TODO
export interface MigrationRunner {
    (): Promise<void>
    _seen?: boolean
}

export interface FindOpts {
    ignoreCase?: string[]
    reverse?: boolean
    skip?: number
    limit?: number
    /**
     * Returns associated PKs for each found suggestion.
     * _Only used in suggest methods._
     */
    suggestPks?: boolean
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
    /**
     * Used internally for fields that are also indexed. Should be set to the index of the
     * corresponding `IndexDefinition` in the `CollectionDefinition`'s `indices` array.
     */
    _index?: number
}

export type IndexSourceFields = string | [string, string]

export interface IndexDefinition {
    /**
     * Points to a corresponding field name defined in the `fields` part of the collection definition.
     * In the case of a compound index, this should be a pair of fields expressed as an `Array`.
     */
    field: IndexSourceFields
    /**
     * Denotes whether or not this index should be a primary key. There should only be one index
     * with this flag set.
     */
    pk?: boolean
    /**
     * Denotes the index being enforced as unique.
     */
    unique?: boolean
    /**
     * Denotes the primary key index will be auto-incremented.
     * Only used if `pk` flag also set. Implies `unique` flag set.
     */
    autoInc?: boolean
    /**
     * Sets a custom name for the corresponding index created to afford full-text search.
     * Note that this will only be used if the corresponding field definition in `fields` is
     * of `type` `'text'`.
     */
    fullTextIndexName?: string
}
export interface CollectionDefinition {
    version: Date
    indices: IndexDefinition[]
    fields: CollectionFields
    migrate?: MigrationRunner
    name?: string
}

export interface RegisterableStorage {
    registerCollection(name: string, defs: CollectionDefinitions): void
}

export interface SuggestResult {
    suggestion: string
    collectionName: string
    pk?: any
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
    suggest<T>(
        collectionName: string,
        filter: FilterQuery<T>,
        opts?: FindOpts,
    ): Promise<SuggestResult[]>
    _finishInitialization(storage): void
}

export interface DexieSchema {
    version: number
    migrations: MigrationRunner[]
    schema: {
        [collName: string]: string
    }
}

export abstract class FeatureStorage {
    constructor(protected storageManager: ManageableStorage) {}
}
