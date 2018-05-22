import { extractTerms } from '../search-index-old/pipeline'

export class StorageManager {
    public initialized = false
    private _registeredCollections = {}
    private _registeredByVersion = {}
    private _initializationPromise
    private _initializationResolve
    private _storage

    constructor() {
        this._initializationPromise = new Promise(resolve => this._initializationResolve = resolve)
    }

    registerCollection(name, defs) {
        if (!(defs instanceof Array)) {
            defs = [defs]
        }

        defs.sort(def => def.version.getTime()).forEach(def => {
            this._registeredCollections[name] = def
            def.name = name

            const indices = def.indices || []
            indices.forEach(fieldName => {
                def.fields[fieldName]._index = true
            })

            const version = def.version.getTime()
            this._registeredByVersion[version] = this._registeredByVersion[version] || []
            this._registeredByVersion[version].push(def)
        })
    }

    async putObject(collectionName: string, object) {
        console.log('1111')
        await this._initializationPromise
        console.log('222')

        const collection = this._registeredCollections[collectionName]
        const indices = collection.indices || []
        Object.entries(collection.fields).forEach(([fieldName, fieldDef]) => {
            if (fieldDef['_index'] && fieldDef['type'] === 'text') {
                object[`_${fieldName}_terms`] = [...extractTerms(object[fieldName], '_')]
            } else if (fieldDef['type'] === 'json') {
                object[fieldName] = JSON.stringify(object[fieldName])
            }
        })
        console.log(object)

        await this._storage[collectionName].put(object)
    }

    _finishInitialization(storage) {
        this._storage = storage
        this._initializationResolve()
    }

    _getDexieHistory() {
        const collections = {}
        const versions = []
        let version = 0
        Object.entries(this._registeredByVersion)
            .sort((left, right) => left[0] < right[0] ? -1 : 1)
            .forEach(([versionTimestamp, defs]) => {
                (<Array<any>>defs).forEach(def => {
                    collections[def.name] = def
                })
                versions.push({ ...this._getDexieSchema(collections), version: ++version })
            })
        return versions
    }

    _getDexieSchema(collections) {
        const schema = {}
        const migrations = []
        Object.entries(collections).forEach(([collectionName, collectionDef]) => {
            const dexieTable = []
            const sortedFields = Object.entries(collectionDef['fields'])
                .sort(([fieldName, fieldDef]) => fieldDef['pk'] ? -1 : 1)

            sortedFields.forEach(([fieldName, fieldDef]) => {
                const listPrefix = fieldDef['type'] === 'text' ? '*' : ''
                const dexieField = `${listPrefix}${fieldName}`
                dexieTable.push(dexieField)
            })
            schema[collectionName] = dexieTable.join(', ')

            if (collectionDef['migrate'] && !collectionDef['migrate']._seen) {
                collectionDef['migrate']._seen = true // TODO: Clean this up, should have no side-effects
                migrations.push(collectionDef['migrate'])
            }
        })
        return { schema, migrations }
    }
}
