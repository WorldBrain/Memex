import { extractTerms } from '../../search-index-old/pipeline'
import StorageRegistry from './registry'
import { ManageableStorage, CollectionDefinitions } from './types'

export class StorageManager implements ManageableStorage {
    public initialized = false
    public registry = new StorageRegistry()
    private _initializationPromise: Promise<void>
    private _initializationResolve: Function
    private _storage

    constructor() {
        this._initializationPromise = new Promise(resolve => this._initializationResolve = resolve)
    }

    registerCollection(name: string, defs: CollectionDefinitions) {
        this.registry.registerCollection(name, defs)
    }

    async putObject(collectionName: string, object) {
        await this._initializationPromise

        const collection = this.registry.collections[collectionName]
        const indices = collection.indices || []
        Object.entries(collection.fields).forEach(([fieldName, fieldDef]) => {
            if (fieldDef._index && fieldDef.type === 'text') {
                object[`_${fieldName}_terms`] = [...extractTerms(object[fieldName])]
            }
        })

        await this._storage[collectionName].put(object)
    }

    _finishInitialization(storage) {
        this._storage = storage
        this._initializationResolve()
    }
}
