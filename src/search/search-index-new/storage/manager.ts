import { extractTerms } from '../../search-index-old/pipeline'
import StorageRegistry from './registry'

export class StorageManager {
    public initialized = false
    public registry = new StorageRegistry()
    private _initializationPromise
    private _initializationResolve
    private _storage

    constructor() {
        this._initializationPromise = new Promise(resolve => this._initializationResolve = resolve)
    }

    registerCollection(name, defs) {
        this.registry.registerCollection(name, defs)
    }

    async putObject(collectionName: string, object) {
        await this._initializationPromise

        const collection = this.registry.collections[collectionName]
        const indices = collection.indices || []
        Object.entries(collection.fields).forEach(([fieldName, fieldDef]) => {
            if (fieldDef['_index'] && fieldDef['type'] === 'text') {
                object[`_${fieldName}_terms`] = [...extractTerms(object[fieldName], '_')]
            }
        })

        await this._storage[collectionName].put(object)
    }

    _finishInitialization(storage) {
        this._storage = storage
        this._initializationResolve()
    }
}
