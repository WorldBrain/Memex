import groupBy from 'lodash/fp/groupBy'
import Dexie from 'dexie'

import { Page, Visit, Bookmark, Tag, FavIcon } from './models'
import { StorageManager } from './storage-manager'

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

        this._initSchema(storageManager && storageManager._getDexieHistory())
    }

    /**
     * See docs for explanation of Dexie table schema syntax:
     * http://dexie.org/docs/Version/Version.stores()
     */
    private _initSchema(dexieHistory) {
        dexieHistory = dexieHistory || []
        const baseVersion = 1
        const baseSchema = {
            pages: 'url, *terms, *titleTerms, *urlTerms, domain, hostname',
            visits: '[time+url], url',
            bookmarks: 'url, time',
            tags: '[name+url], name, url',
            favIcons: 'hostname',
        }
        this.version(baseVersion).stores(baseSchema)

        dexieHistory.forEach(({ version, schema, migrations }) => {
            const finalVersion = baseVersion + version
            const finalSchema = Object.assign(baseSchema, schema)
            this.version(finalVersion).stores(finalSchema).upgrade(() => {
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
