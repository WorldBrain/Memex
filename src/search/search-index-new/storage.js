import Dexie from 'dexie'

import { Page, Visit, Bookmark, Tag } from './models'

export default class Storage extends Dexie {
    static DEF_PARAMS = {
        indexedDB: null,
        IDBKeyRange: null,
        dbName: 'memex',
    }
    static MIN_STR = ''
    static MAX_STR = String.fromCharCode(65535)

    /**
     * @type {Dexie.Table} Represents page data - our main data type.
     */
    pages

    /**
     * @type {Dexie.Table} Represents page visit timestamp and activity data.
     */
    visits

    /**
     * @type {Dexie.Table} Represents page visit timestamp and activity data.
     */
    bookmarks

    /**
     * @type {Dexie.Table} Represents tags associated with Pages.
     */
    tags

    constructor({ indexedDB, IDBKeyRange, dbName } = Storage.DEF_PARAMS) {
        super(dbName || Storage.DEF_PARAMS.dbName, {
            indexedDB: indexedDB || window.indexedDB,
            IDBKeyRange: IDBKeyRange || window.IDBKeyRange,
        })

        this._initSchema()
    }

    /**
     * See docs for explanation of Dexie table schema syntax:
     * http://dexie.org/docs/Version/Version.stores()
     */
    _initSchema() {
        this.version(1).stores({
            pages: 'url, *terms, *titleTerms, *urlTerms, domain',
            visits: '[time+url], url',
            bookmarks: 'url, time',
            tags: '[name+url], name, url',
        })

        // ... add versions/migration logic here

        // Set up model classes
        this.pages.mapToClass(Page)
        this.visits.mapToClass(Visit)
        this.bookmarks.mapToClass(Bookmark)
        this.tags.mapToClass(Tag)
    }

    /**
     * Performs async clearing of each table in succession; don't use unless you want to lose __all your data__
     *
     * @return {Promise<void>}
     */
    async clearData() {
        for (const table of this.tables) {
            await table.clear()
        }
    }
}
