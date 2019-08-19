import Storex from '@worldbrain/storex'
import { EventEmitter } from 'events'

import BackupStorage from '../../storage'
import { BackupBackend, ObjectChange } from '../../backend'
import Interruptable from '../interruptable'
import { DownloadQueue } from './download-queue'
import {
    USERS_COLL,
    POSTS_COLL,
    BMS_COLL,
} from 'src/social-integration/constants'
import decodeBlob from 'src/util/decode-blob'
const sorted = require('lodash/sortBy')
const zipObject = require('lodash/zipObject')

export interface BackupRestoreInfo {
    status: 'preparing' | 'synching'
    totalChanges?: number
    processedChanges: number
}

export class BackupRestoreProcedure {
    storageManager: Storex
    storage: BackupStorage
    backend: BackupBackend

    info?: BackupRestoreInfo = null
    events?: EventEmitter
    interruptable?: Interruptable

    logErrors: boolean

    constructor({
        storageManager,
        storage,
        backend,
        logErrors = true,
    }: {
        storageManager: Storex
        storage: BackupStorage
        backend: BackupBackend
        logErrors?: boolean
    }) {
        this.storageManager = storageManager
        this.storage = storage
        this.backend = backend
        this.logErrors = logErrors
    }

    get running() {
        return !!this.interruptable
    }

    runner() {
        this.events = new EventEmitter()
        this.interruptable = new Interruptable()

        const procedure = async () => {
            this._updateInfo({ status: 'preparing', processedChanges: 0 })

            try {
                this._stopRecordingChanges()
                await this._clearDatabase()
                await this._blockDatabase()

                const [
                    changeSetTimestamps,
                    imageTimestamps,
                ] = await Promise.all([
                    this._listBackupCollection('change-sets'),
                    this._listBackupCollection('images'),
                ])

                /* Backup file not found */
                if (!changeSetTimestamps.length) {
                    await this._unblockDatabase()
                    throw new Error('Backup file not found')
                }

                this._updateInfo({
                    status: 'synching',
                    totalChanges:
                        changeSetTimestamps.length + imageTimestamps.length,
                })

                await this.interruptable.execute(() =>
                    this._restoreCollection(
                        'change-sets',
                        changeSetTimestamps,
                        'changes',
                        this._writeChange.bind(this),
                    ),
                )
                await this.interruptable.execute(() =>
                    this._restoreCollection(
                        'images',
                        imageTimestamps,
                        'images',
                        this._writeImage.bind(this),
                    ),
                )

                await this._unblockDatabase()
                if (!this.interruptable.cancelled) {
                    this._startRecordingChanges()
                    this.events.emit('success')
                    return 'success'
                } else {
                    await this._clearDatabase()
                    this.events.emit('cancelled')
                    return 'cancelled'
                }
            } catch (e) {
                if (this.logErrors) {
                    console.error(e)
                }
                this.events.emit('fail', { error: e.message })
                return 'fail'
            } finally {
                this.interruptable = null
                this.events = null
                this.info = null
            }
        }

        return procedure
    }

    _startRecordingChanges() {
        this.storage.startRecordingChanges()
    }

    _stopRecordingChanges() {
        this.storage.stopRecordingChanges()
    }

    async _clearDatabase() {
        const search = require('src/search')
        await search.dangerousPleaseBeSureDeleteAndRecreateDatabase()
    }

    _blockDatabase() {}

    async _restoreCollection(
        collection: string,
        timestamps: string[],
        changesKey: string,
        writeObject: (object: any) => Promise<any>,
    ) {
        const changeSetDownloadQueue = this._createDownloadQueue(
            collection,
            timestamps,
        )
        await this._restoreFromDownloadQueue(
            changeSetDownloadQueue,
            changesKey,
            writeObject,
        )
    }

    async _restoreFromDownloadQueue(
        queue: DownloadQueue,
        changesKey: string,
        writeObject: (object: any) => Promise<any>,
    ) {
        await this.interruptable.whileLoop(
            () => queue.hasNext(),
            async () => {
                const batch = await queue.getNext()
                await this.interruptable.forOfLoop(
                    batch.changes || batch.images,
                    async change => {
                        await writeObject(change)
                    },
                )
                this._updateInfo({
                    processedChanges: this.info.processedChanges + 1,
                })
            },
        )
    }

    _unblockDatabase() {}

    async _writeChange(change: ObjectChange) {
        change = this._filterBadChange(change)
        this._deserializeChangeFields(change)
        _migrateObject(change)

        const collection = this.storageManager.collection(change.collection)
        if (change.operation === 'create') {
            // console.log('creating', change.object)
            await collection.createObject(change.object)
        } else if (change.operation === 'update') {
            // console.log('updating', _getChangeWhere(change), change.object)
            await collection.updateObjects(
                this._getChangeWhere(change),
                change.object,
            )
        } else if (change.operation === 'delete') {
            // console.log('deleting', _getChangeWhere(change))
            await collection.deleteObjects(this._getChangeWhere(change))
        }
    }

    async _writeImage(image) {
        if (!image || !image.data) {
            return // invalid data, ignore
        }

        const collection = this.storageManager.collection(image.collection)
        const where = this._getChangeWhere(image)
        const updates = {
            $set: { [image.type]: this._blobFromPngString(image.data) },
        }

        try {
            await collection.updateOneObject(where, updates)
        } catch (e) {
            console.error('Failed to commit image', where, image, updates)
        }
    }

    _createDownloadQueue(collection: string, timestamps: string[]) {
        const items = sorted(timestamps).map(timestamp => [
            collection,
            timestamp,
        ])
        return new DownloadQueue({
            items,
            fetcher: this._createBackupObjectFetcher(),
        })
    }

    _listBackupCollection(collection: string) {
        return this.backend.listObjects(collection)
    }

    _createBackupObjectFetcher() {
        return ([collection, object]) =>
            this.backend.retrieveObject(collection, object)
    }

    _updateInfo(changes) {
        this.info = { ...this.info, ...changes }
        this.events.emit('info', { info: this.info })
    }

    _getChangeWhere(change: ObjectChange) {
        // TODO: What if none of these are true?
        const collectionDef = this.storageManager.registry.collections[
            change.collection
        ]
        const pkIndex = collectionDef.pkIndex
        if (pkIndex instanceof Array) {
            return zipObject(pkIndex, change.objectPk || change['pk'])
        } else if (typeof pkIndex === 'string') {
            return { [pkIndex]: change.objectPk || change['pk'] }
        }
    }

    _filterBadChange({ object, ...change }: ObjectChange): ObjectChange {
        if (
            change.operation !== 'delete' &&
            object != null &&
            Object.entries(object).length === 0
        ) {
            // Empty objects in backups have been causing issues; unset operation to skip write
            return { ...change, object, operation: null }
        }

        if (
            change.collection === 'pages' &&
            object != null &&
            this._isBadBlob(object.screenshot)
        ) {
            // Pages can exist without screenshot Blobs; omit bad value
            const { screenshot, ...objectMod } = object
            return { ...change, object: objectMod }
        }

        if (
            change.collection === 'favIcons' &&
            object != null &&
            this._isBadBlob(object.favIcon)
        ) {
            // FavIcons cannot exist without favIcon Blobs; unset operation to skip write
            return { ...change, object, operation: null }
        }

        if (
            change.collection === USERS_COLL &&
            object != null &&
            this._isBadBlob(object.profilePic)
        ) {
            // Users can exist without profilePic Blobs; omit bad value
            const { profilePic, ...objectMod } = object
            return { ...change, object: objectMod }
        }

        return { ...change, object }
    }

    _isBadBlob(val) {
        return (
            val != null &&
            !(val instanceof this._getBlobClass()) &&
            !Object.keys(val).length
        )
    }

    _getBlobClass() {
        return Blob
    }

    _getAtobFunction() {
        return atob
    }

    _deserializeChangeFields(change: ObjectChange) {
        const object = change.object
        const checkSerializedExists = (colls: string[], field: string) =>
            colls.includes(change.collection) &&
            !!object[field] &&
            typeof object[field] === 'string'

        if (checkSerializedExists(['favIcons'], 'favIcon')) {
            object.favIcon = this._blobFromPngString(object.favIcon)
        }

        if (checkSerializedExists(['annotations', POSTS_COLL], 'createdWhen')) {
            object.createdWhen = new Date(object.createdWhen)
        }

        if (checkSerializedExists(['annotations'], 'lastEdited')) {
            object.lastEdited = new Date(object.lastEdited)
        }

        if (
            checkSerializedExists(
                ['customLists', 'pageListEntries', POSTS_COLL, BMS_COLL],
                'createdAt',
            )
        ) {
            object.createdAt = new Date(object.createdAt)
        }
    }

    _blobFromPngString(s: string) {
        const prefix = 'data:'
        if (s.substr(0, prefix.length) !== prefix) {
            s = 'data:image/png;base64,' + s
        }
        return decodeBlob(s, {
            blobClass: this._getBlobClass(),
            atobFunction: this._getAtobFunction(),
        })
    }
}

export function _migrateObject(change: ObjectChange) {
    const object = change.object
    const migrate = <T = any>(args: {
        collection: string
        field: string
        value: (prev: T) => any
    }) => {
        if (change.collection === args.collection) {
            object[args.field] = args.value(object)
        }
    }

    // `lastEdited` was changed from a nullable to non-null field used in search feature.
    // All missing data should be set to created time.
    migrate({
        collection: 'annotations',
        field: 'lastEdited',
        value: prev => prev.createdWhen,
    })
}
