import { extractTerms } from '../../search-index-old/pipeline'
import Storage from '../storage'
import StorageRegistry from './registry'
import {
    ManageableStorage,
    CollectionDefinitions,
    CollectionDefinition,
    CollectionField,
    FilterQuery,
    FindOpts,
} from './types'

export class StorageManager implements ManageableStorage {
    static DEF_FIND_OPTS: Partial<FindOpts> = {
        reverse: false,
    }

    public initialized = false
    public registry = new StorageRegistry()
    private _initializationPromise: Promise<void>
    private _initializationResolve: Function
    private _storage: Storage

    private static _processIndexedField(
        indexName: string,
        fieldDef: CollectionField,
        object,
    ) {
        if (fieldDef.fieldObject) {
            object[indexName] = fieldDef.fieldObject.prepareForStorage(
                object[indexName],
            )
        }

        if (fieldDef._index && fieldDef.type === 'text') {
            object[`_${indexName}_terms`] = [...extractTerms(object[indexName])]
        }
    }

    /**
     * Handles mutation of a document to be inserted/updated to storage,
     * depending on needed processing of indexed fields.
     */
    private static _processIndexedFields(
        collection: CollectionDefinition,
        object,
    ) {
        const indices = collection.indices || []

        indices.forEach(index => {
            if (index instanceof Array) {
                index.forEach(indexName =>
                    StorageManager._processIndexedField(
                        indexName,
                        collection.fields[indexName],
                        object,
                    ),
                )
            } else {
                StorageManager._processIndexedField(
                    index,
                    collection.fields[index],
                    object,
                )
            }
        })
    }

    constructor() {
        this._initializationPromise = new Promise(
            resolve => (this._initializationResolve = resolve),
        )
    }

    registerCollection(name: string, defs: CollectionDefinitions) {
        this.registry.registerCollection(name, defs)
    }

    private async _find<T>(
        collectionName: string,
        filter: FilterQuery<T>,
        findOpts: FindOpts,
    ) {
        let coll = await this._storage
            .collection<T>(collectionName)
            .find(filter)

        if (findOpts.reverse) {
            coll = coll.reverse()
        }

        if (findOpts.skip && findOpts.skip > 0) {
            coll = coll.offset(findOpts.skip)
        }

        if (findOpts.limit) {
            coll = coll.limit(findOpts.limit)
        }

        return coll
    }

    /**
     * @param collectionName The name of the collection to query.
     * @param object
     */
    async putObject(collectionName: string, object) {
        await this._initializationPromise

        const collection = this.registry.collections[collectionName]
        StorageManager._processIndexedFields(collection, object)

        await this._storage[collectionName].put(object)
    }

    /**
     * @param collectionName The name of the collection to query.
     * @param filter
     * @param [findOpts]
     * @returns Promise that resolves to the first object found in the collection which matches the filter.
     */
    async findObject<T>(
        collectionName: string,
        filter: FilterQuery<T>,
        findOpts: FindOpts = StorageManager.DEF_FIND_OPTS,
    ): Promise<T> {
        await this._initializationPromise

        const coll = await this._find<T>(collectionName, filter, findOpts)
        return coll.first()
    }

    /**
     * @param collectionName The name of the collection to query.
     * @param filter
     * @param [findOpts]
     * @returns Promise that resolves to an array of the objects found in the collection which match the filter.
     */
    async findAll<T>(
        collectionName: string,
        filter: FilterQuery<T>,
        findOpts: FindOpts = StorageManager.DEF_FIND_OPTS,
    ): Promise<T[]> {
        await this._initializationPromise

        const coll = await this._find<T>(collectionName, filter, findOpts)
        return coll.toArray()
    }

    /**
     * @param collectionName The name of the collection to query.
     * @param filter
     * @returns Promise that resolves to the number of objects in the collection which match the filter.
     */
    async countAll<T>(collectionName: string, filter: FilterQuery<T>) {
        await this._initializationPromise

        return await this._storage.collection(collectionName).count(filter)
    }

    /**
     * @param collectionName The name of the collection to query.
     * @param filter
     * @returns Promise that resolves to the number of objects in the collection which have been deleted.
     */
    async deleteObject<T>(collectionName: string, filter: FilterQuery<T>) {
        await this._initializationPromise

        const { deletedCount } = await this._storage
            .collection(collectionName)
            .remove(filter)

        return deletedCount
    }

    /**
     * @param collectionName The name of the collection to query.
     * @param filter
     * @param update An object which contains fields which will be updated according to their values.
     *      More info: https://github.com/YurySolovyov/dexie-mongoify/blob/master/docs/update-api.md
     * @returns Promise that resolves to the number of objects in the collection which have been updated.
     */
    async updateObject<T>(
        collectionName: string,
        filter: FilterQuery<T>,
        update,
    ) {
        await this._initializationPromise

        // TODO: extract underlying collection doc fields from update object
        // const collection = this.registry.collections[collectionName]
        // StorageManager._processIndexedFields(collection, object)

        const { modifiedCount } = await this._storage
            .collection(collectionName)
            .update(filter, update)

        return modifiedCount
    }

    _finishInitialization(storage) {
        this._storage = storage
        this._initializationResolve()
    }
}
