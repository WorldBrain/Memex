import groupBy from 'lodash/fp/groupBy'
import Dexie from 'dexie'
import 'dexie-mongoify'

import { Page, Visit, Bookmark, Tag, FavIcon } from '../models'
import { StorageManager } from './manager'
import { getDexieHistory } from './dexie-schema'
import { DexieSchema, FilterQuery } from './types'

export * from './types'

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
        storageManager: null,
    }
    public static MIN_STR = ''
    public static MAX_STR = String.fromCharCode(65535)

    // Quick typings as `dexie-mongoify` doesn't contain any
    public collection: <T>(
        name: string,
    ) => {
        find(query: FilterQuery<T>): Dexie.Collection<T, any>
        count(query: FilterQuery<T>): Promise<number>
        update(
            query: FilterQuery<T>,
            update,
        ): Promise<{ modifiedCount: number }>
        remove(query: FilterQuery<T>): Promise<{ deletedCount: number }>
    }

    /**
     * Represents page data - our main data type.
     */
    public pages: Dexie.Table<Page, string>

    /**
     * Represents page visit timestamp and activity data.
     */
    public visits: Dexie.Table<Visit, [number, string]>

    /**
     * Represents page visit timestamp and activity data.
     */
    public bookmarks: Dexie.Table<Bookmark, string>

    /**
     * Represents tags associated with Pages.
     */
    public tags: Dexie.Table<Tag, [string, string]>

    /**
     * Represents fav-icons associated with hostnames.
     */
    public favIcons: Dexie.Table<FavIcon, string>

    private storageManager: StorageManager

    constructor(
        { indexedDB, IDBKeyRange, dbName, storageManager } = Storage.DEF_PARAMS,
    ) {
        super(dbName || Storage.DEF_PARAMS.dbName, {
            indexedDB: indexedDB || window.indexedDB,
            IDBKeyRange: IDBKeyRange || window['IDBKeyRange'],
        })

        this.storageManager = storageManager

        this._initSchema()
    }

    /**
     * See docs for explanation of Dexie table schema syntax:
     * http://dexie.org/docs/Version/Version.stores()
     */
    private _initSchema() {
        // TODO: move these declarations to own feature storage classes
        this.storageManager.registerCollection('pages', {
            version: new Date(2018, 1, 1),
            fields: {
                url: { type: 'string' },
                fullUrl: { type: 'text' },
                fullTitle: { type: 'text' },
                text: { type: 'text' },
                domain: { type: 'string' },
                hostname: { type: 'string' },
                screenshot: { type: 'blob' },
                lang: { type: 'string' },
                canonicalUrl: { type: 'url' },
                description: { type: 'text' },
            },
            indices: [
                { field: 'url', pk: true },
                { field: 'text', fullTextIndexName: 'terms' },
                { field: 'fullTitle', fullTextIndexName: 'titleTerms' },
                { field: 'fullUrl', fullTextIndexName: 'urlTerms' },
                { field: 'domain' },
                { field: 'hostname' },
            ],
        })

        this.storageManager.registerCollection('visits', {
            version: new Date(2018, 1, 1),
            fields: {
                url: { type: 'string' },
                time: { type: 'timestamp' },
                duration: { type: 'int' },
                scrollMaxPerc: { type: 'float' },
                scrollMaxPx: { type: 'float' },
                scrollPerc: { type: 'float' },
                scrollPx: { type: 'float' },
            },
            indices: [{ field: ['time', 'url'], pk: true }, { field: 'url' }],
        })

        this.storageManager.registerCollection('bookmarks', {
            version: new Date(2018, 1, 1),
            fields: {
                url: { type: 'string' },
                time: { type: 'timestamp' },
            },
            indices: [{ field: 'url', pk: true }, { field: 'time' }],
        })

        this.storageManager.registerCollection('tags', {
            version: new Date(2018, 1, 1),
            fields: {
                url: { type: 'string' },
                name: { type: 'string' },
            },
            indices: [
                { field: ['name', 'url'], pk: true },
                { field: 'name' },
                { field: 'url' },
            ],
        })

        this.storageManager.registerCollection('favIcons', {
            version: new Date(2018, 1, 1),
            fields: {
                hostname: { type: 'string' },
                favIcon: { type: 'blob' },
            },
            indices: [{ field: 'hostname', pk: true }],
        })

        const dexieHistory = getDexieHistory(this.storageManager.registry)
        const baseVersion = 0

        dexieHistory.forEach(({ version, schema, migrations }) => {
            const finalVersion = baseVersion + version
            const finalSchema = schema
            this.version(finalVersion)
                .stores(finalSchema)
                .upgrade(() => {
                    migrations.forEach(migration => {
                        // TODO: Call migration with some object that allows for data manipulation
                    })
                })
        })

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
