const _ = require('lodash')
import Dexie from 'dexie'

import { extractTerms } from '../search-index-old/pipeline'
import { Page, Visit, Bookmark, Tag, FavIcon } from './models'

export interface Props {
    indexedDB: IDBFactory
    IDBKeyRange: typeof IDBKeyRange
    dbName: string
    storageManager?: StorageManager
}

export default class Storage extends Dexie {
    private static DEF_PARAMS: Props = {
        indexedDB: null,
        IDBKeyRange: null,
        dbName: 'memex',
        storageManager: null
    }
    public static MIN_STR = ''
    public static MAX_STR = String.fromCharCode(65535)

    /**
     * @type {Dexie.Table} Represents page data - our main data type.
     */
    public pages: Dexie.Table<Page, string>

    /**
     * @type {Dexie.Table} Represents page visit timestamp and activity data.
     */
    public visits: Dexie.Table<Visit, [number, string]>

    /**
     * @type {Dexie.Table} Represents page visit timestamp and activity data.
     */
    public bookmarks: Dexie.Table<Bookmark, string>

    /**
     * @type {Dexie.Table} Represents tags associated with Pages.
     */
    public tags: Dexie.Table<Tag, [string, string]>

    /**
     * @type {Dexie.Table} Represents fav-icons associated with hostnames.
     */
    public favIcons: Dexie.Table<FavIcon, string>

    constructor({ indexedDB, IDBKeyRange, dbName, storageManager } = Storage.DEF_PARAMS) {
        super(dbName || Storage.DEF_PARAMS.dbName, {
            indexedDB: indexedDB || window.indexedDB,
            IDBKeyRange: IDBKeyRange || window['IDBKeyRange'],
        })

        this._initSchema(storageManager && storageManager._getDexieSchema())
    }

    /**
     * See docs for explanation of Dexie table schema syntax:
     * http://dexie.org/docs/Version/Version.stores()
     */
    private _initSchema(extra) {
        extra = extra || { version: 0, schema: {} }
        const baseVersion = 1
        const baseSchema = {
            pages: 'url, *terms, *titleTerms, *urlTerms, domain, hostname',
            visits: '[time+url], url',
            bookmarks: 'url, time',
            tags: '[name+url], name, url',
            favIcons: 'hostname',
        }
        this.version(baseVersion).stores(baseSchema)

        const finalVersion = baseVersion + extra.version
        const finalSchema = Object.assign(baseSchema, extra.schema)
        this.version(finalVersion).stores(finalSchema).upgrade(() => { })

        // ... add versions/migration logic here

        // Set up model classes
        this.pages.mapToClass(Page)
        this.visits.mapToClass(Visit)
        this.bookmarks.mapToClass(Bookmark)
        this.tags.mapToClass(Tag)
        this.favIcons.mapToClass(FavIcon)
    }

    /**
     * Performs async clearing of each table in succession; don't use unless you want to lose __all your data__
     *
     * @return {Promise<void>}
     */
    public async clearData() {
        for (const table of this.tables) {
            await table.clear()
        }
    }
}

export class StorageManager {
    public initialized = false
    private _registeredCollections = {}
    private _initializationPromise
    private _initializationResolve
    private _storage

    constructor() {
        this._initializationPromise = new Promise(resolve => this._initializationResolve = resolve)
    }

    registerCollection(name, def) {
        this._registeredCollections[name] = def
    }

    async putObject(collectionName: string, object) {
        await this._initializationPromise

        const collection = this._registeredCollections[collectionName]
        _.each(collection.indices || [], (fieldName) => {
            const fieldDef = collection.fields[fieldName]
            if (fieldDef.type === 'text') {
                object[fieldName] = [...extractTerms(object[fieldName], '_')]
            }
        })

        await this._storage[collectionName].put(object)
    }

    _finishInitialization(storage) {
        this._storage = storage
        this._initializationResolve()
    }

    _getDexieSchema() {
        let version = 0
        const schema = {}
        _.each(this._registeredCollections, (collectionDef, collectionName) => {
            const dexieTable = []
            _(collectionDef.fields)
                .toPairs()
                .sortBy(([fieldName, fieldDef]) => fieldDef.pk ? 0 : 1)
                .each(([fieldName, fieldDef]) => {
                    const listPrefix = fieldDef.type === 'text' ? '*' : ''
                    const dexieField = `${listPrefix}${fieldName}`
                    dexieTable.push(dexieField)
                })
            schema[collectionName] = dexieTable.join(', ')
            version += collectionDef.version
        })
        return { version, schema }
    }
}
