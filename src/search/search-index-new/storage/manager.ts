import { extractTerms } from '../../search-index-old/pipeline'
import Storage from '../storage'
import StorageRegistry from './registry'
import {
    ManageableStorage,
    CollectionDefinitions,
    CollectionDefinition,
    CollectionField,
    IndexDefinition,
    FilterQuery,
    FindOpts,
} from './types'

export class StorageManager implements ManageableStorage {
    static DEF_SUGGEST_LIMIT = 10
    static DEF_FIND_OPTS: Partial<FindOpts> = {
        reverse: true,
        limit: 1,
    }

    public initialized = false
    public registry = new StorageRegistry()
    private _initializationPromise: Promise<void>
    private _initializationResolve: Function
    private _storage: Storage

    private static _processIndexedField(
        fieldName: string,
        indexDef: IndexDefinition,
        fieldDef: CollectionField,
        object,
    ) {
        if (fieldDef.fieldObject) {
            object[fieldName] = fieldDef.fieldObject.prepareForStorage(
                object[fieldName],
            )
        }

        if (fieldDef._index && fieldDef.type === 'text') {
            const fullTextField =
                indexDef.fullTextIndexName || `_${fieldName}_terms`
            object[fullTextField] = [...extractTerms(object[fieldName])]
        }
    }

    /**
     * Handles mutation of a document to be inserted/updated to storage,
     * depending on needed processing of indexed fields.
     */
    private static _processIndexedFields(def: CollectionDefinition, object) {
        const indices = def.indices || []

        indices.forEach(indexDef => {
            const processField = (fieldName: string) =>
                StorageManager._processIndexedField(
                    fieldName,
                    indexDef,
                    def.fields[fieldName],
                    object,
                )

            // Compound indexes need to process all specified fields
            if (indexDef.field instanceof Array) {
                indexDef.field.forEach(processField)
            } else {
                processField(indexDef.field)
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
     * @param filter Note this is not a fully-featured filter query, like in other methods.
     *  Only the first `{ [indexName]: stringQuery }` will be taken and used; everything else is ignored.
     * @param [findOpts] Note that only `reverse` and `limit` options will be applied.
     * @returns Promise that resolves to the first `findOpts.limit` matches of the
     *  query to the index, both specified in `filter`.
     */
    async suggest<T>(
        collectionName: string,
        filter: FilterQuery<T>,
        {
            limit = StorageManager.DEF_SUGGEST_LIMIT,
            reverse,
        }: FindOpts = StorageManager.DEF_FIND_OPTS,
    ) {
        await this._initializationPromise

        // Grab first entry from the filter query; ignore rest for now
        const [[indexName, value]] = Object.entries(filter)

        let coll = this._storage
            .table<T>(collectionName)
            .where(indexName)
            .startsWith(value)
            .limit(limit)

        if (reverse) {
            coll = coll.reverse()
        }

        return coll.uniqueKeys()
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
