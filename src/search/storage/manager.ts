import { EventEmitter } from 'events'
import { extractTerms } from '../pipeline'
import Storage from '.'
import StorageRegistry from './registry'
import { UnimplementedError, InvalidFindOptsError } from './errors'
import {
    ManageableStorage,
    CollectionDefinitions,
    CollectionDefinition,
    CollectionField,
    IndexDefinition,
    FilterQuery,
    FindOpts,
    SuggestResult,
} from './types'

export class StorageManager extends EventEmitter implements ManageableStorage {
    static DEF_SUGGEST_LIMIT = 10
    static DEF_FIND_OPTS: Partial<FindOpts> = {
        reverse: false,
    }

    public initialized = false
    public registry = new StorageRegistry()
    private _initializationPromise: Promise<void>
    private _initializationResolve: () => void
    private _storage: Storage

    /**
     * Handles mutation of a document to be inserted/updated to storage,
     * depending on needed pre-processing for a given indexed field.
     */
    private static _processIndexedField(
        fieldName: string,
        indexDef: IndexDefinition,
        fieldDef: CollectionField,
        object,
    ) {
        switch (fieldDef.type) {
            case 'text':
                const fullTextField =
                    indexDef.fullTextIndexName ||
                    StorageRegistry.createTermsIndex(fieldName)
                object[fullTextField] = [...extractTerms(object[fieldName])]
                break
            default:
        }
    }

    /**
     * Handles mutation of a document to be written to storage,
     * depending on needed pre-processing of fields.
     */
    private static _processFieldsForWrites(def: CollectionDefinition, object) {
        Object.entries(def.fields).forEach(([fieldName, fieldDef]) => {
            if (fieldDef.fieldObject) {
                object[fieldName] = fieldDef.fieldObject.prepareForStorage(
                    object[fieldName],
                )
            }

            if (fieldDef._index != null) {
                StorageManager._processIndexedField(
                    fieldName,
                    def.indices[fieldDef._index],
                    fieldDef,
                    object,
                )
            }
        })
    }

    /**
     * Handles mutation of a document to be read from storage,
     * depending on needed pre-processing of fields.
     */
    private static _processFieldsForReads(def: CollectionDefinition, object) {
        Object.entries(def.fields).forEach(([fieldName, fieldDef]) => {
            if (fieldDef.fieldObject) {
                object[fieldName] = fieldDef.fieldObject.prepareFromStorage(
                    object[fieldName],
                )
            }
        })
    }

    constructor() {
        super()

        this._initializationPromise = new Promise(
            resolve => (this._initializationResolve = resolve),
        )
    }

    registerCollection(name: string, defs: CollectionDefinitions) {
        this.registry.registerCollection(name, defs)
    }

    // TODO: Afford full find support for ignoreCase opt; currently just uses the first filter entry
    private _findIgnoreCase<T>(
        collectionName: string,
        filter: FilterQuery<T>,
        findOpts: FindOpts,
    ) {
        // Grab first entry from the filter query; ignore rest for now
        const [[indexName, value], ...fields] = Object.entries(filter)

        if (fields.length) {
            throw new UnimplementedError(
                'find methods with ignoreCase only support querying a single field.',
            )
        }

        if (findOpts.ignoreCase[0] !== indexName) {
            throw new InvalidFindOptsError(
                'specified ignoreCase field is not in filter query',
            )
        }

        return this._storage
            .table<T>(collectionName)
            .where(indexName)
            .equalsIgnoreCase(value)
    }

    private _find<T>(
        collectionName: string,
        filter: FilterQuery<T>,
        findOpts: FindOpts,
    ) {
        let coll =
            findOpts.ignoreCase && findOpts.ignoreCase.length
                ? this._findIgnoreCase<T>(collectionName, filter, findOpts)
                : this._storage.collection<T>(collectionName).find(filter)

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
        StorageManager._processFieldsForWrites(collection, object)

        return this._storage[collectionName]
            .put(object)
            .catch(Storage.initErrHandler())
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

        const coll = this._find<T>(collectionName, filter, findOpts)
        const doc = await coll.first().catch(Storage.initErrHandler())

        if (doc != null) {
            const collection = this.registry.collections[collectionName]
            StorageManager._processFieldsForReads(collection, doc)
        }

        return doc
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

        const coll = this._find<T>(collectionName, filter, findOpts)

        const docs = await coll
            .toArray()
            .catch(Storage.initErrHandler([] as T[]))

        const collection = this.registry.collections[collectionName]
        docs.forEach(doc =>
            StorageManager._processFieldsForReads(collection, doc),
        )

        return docs
    }

    async findByPk(collectionName: string, pk: string) {
        return await this._storage[collectionName].get(pk)
    }

    async* streamCollection(collectionName: string) {
        const table = this._storage[collectionName]
        const pks = await table.primaryKeys()
        for (const pk of pks) {
            yield await { pk, object: table.get(pk) }
        }
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
            ...findOpts
        }: FindOpts = StorageManager.DEF_FIND_OPTS,
    ): Promise<SuggestResult[]> {
        await this._initializationPromise

        // Grab first entry from the filter query; ignore rest for now
        const [[indexName, value], ...fields] = Object.entries(filter)

        if (fields.length) {
            throw new UnimplementedError(
                'suggest only supports querying a single field.',
            )
        }

        const whereClause = this._storage
            .table<T>(collectionName)
            .where(indexName)

        let coll =
            findOpts.ignoreCase &&
                findOpts.ignoreCase.length &&
                findOpts.ignoreCase[0] === indexName
                ? whereClause.startsWithIgnoreCase(value)
                : whereClause.startsWith(value)

        coll = coll.limit(limit)

        if (findOpts.reverse) {
            coll = coll.reverse()
        }

        const suggestions = (await coll
            .uniqueKeys()
            .catch(Storage.initErrHandler([]))) as string[]
        const pks = findOpts.suggestPks
            ? await coll.primaryKeys().catch(Storage.initErrHandler([]))
            : []

        return suggestions.map((suggestion, i) => ({
            suggestion,
            collectionName,
            pk: pks[i],
        }))
    }

    /**
     * @param collectionName The name of the collection to query.
     * @param filter
     * @returns Promise that resolves to the number of objects in the collection which match the filter.
     */
    async countAll<T>(collectionName: string, filter: FilterQuery<T>) {
        await this._initializationPromise

        return this._storage
            .collection(collectionName)
            .count(filter)
            .catch(Storage.initErrHandler(0))
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
            .catch(Storage.initErrHandler({ deletedCount: 0 }))

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
            .catch(Storage.initErrHandler({ modifiedCount: 0 }))

        return modifiedCount
    }

    _finishInitialization(storage) {
        this._storage = storage
        this._setupChangeEvent()
        this._initializationResolve()
    }

    _setupChangeEvent() {
        if (this.listenerCount('changing') === 0) {
            return
        }

        for (const collectionName in this.registry.collections) {
            if (this.registry.collections[collectionName].watch === false) {
                continue
            }

            const table = this._storage[collectionName]
            table.hook('creating', (pk, obj, transaction) => {
                this.emit('changing', {
                    operation: 'create',
                    collection: collectionName,
                    pk,
                })
            })
            table.hook('updating', (mods, pk, obj, transaction) => {
                this.emit('changing', {
                    operation: 'update',
                    collection: collectionName,
                    pk,
                })
            })
            table.hook('deleting', (pk, obj, transaction) => {
                this.emit('changing', {
                    operation: 'delete',
                    collection: collectionName,
                    pk,
                })
            })
        }
    }
}
