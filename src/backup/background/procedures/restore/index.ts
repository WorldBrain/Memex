const sorted = require('lodash/sortBy')
const zipObject = require('lodash/zipObject')
import { EventEmitter } from 'events'
import { StorageManager } from '../../../../search/types'
import BackupStorage from '../../storage'
import { BackupBackend, ObjectChange } from '../../backend'
import Interruptable from '../interruptable'
import { DownloadQueue } from './download-queue'
import { StorageRegistry } from 'storex'

export interface BackupRestoreInfo {
    status: 'preparing' | 'synching'
    totalChanges?: number
    processedChanges: number
}

export class BackupRestoreProcedure {
    storageManager: StorageManager
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
        storageManager: StorageManager
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
                this.events.emit('fail', e)
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
        change = _filterBadChange(change)

        const collection = this.storageManager.collection(change.collection)
        if (change.operation === 'create') {
            // console.log('creating', change.object)
            await collection.createObject(change.object)
        } else if (change.operation === 'update') {
            // console.log('updating', _getChangeWhere(change, this.storageManager.registry), change.object)
            await collection.updateOneObject(
                _getChangeWhere(change, this.storageManager.registry),
                change.object,
            )
        } else if (change.operation === 'delete') {
            // console.log('deleting', _getChangeWhere(change, this.storageManager.registry))
            await collection.deleteOneObject(
                _getChangeWhere(change, this.storageManager.registry),
            )
        }
    }

    async _writeImage(image) {
        const collection = this.storageManager.collection(image.collection)
        const where = _getChangeWhere(image, this.storageManager.registry)
        await collection.updateOneObject(where, { [image.type]: image.data })
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
}

export function _getChangeWhere(change, registry: StorageRegistry) {
    // TODO: What if none of these are true?
    const collectionDef = registry.collections[change.collection]
    const pkIndex = collectionDef.pkIndex
    if (pkIndex instanceof Array) {
        return zipObject(pkIndex, change.pk)
    } else if (typeof pkIndex === 'string') {
        return { [pkIndex]: change.objectPk }
    }
}

export function _filterBadChange({
    object,
    ...change
}: ObjectChange): ObjectChange {
    const isBadBlob = val =>
        val != null && !(val instanceof Blob) && !Object.keys(val).length

    if (change.collection === 'pages' && isBadBlob(object.screenshot)) {
        // Pages can exist without screenshot Blobs; omit bad value
        const { screenshot, ...objectMod } = object
        return { ...change, object: objectMod }
    }

    if (change.collection === 'favIcons' && isBadBlob(object.favIcon)) {
        // FavIcons cannot exist without favIcon Blobs; unset operation to skip write
        return { ...change, object, operation: null }
    }

    return { ...change, object }
}
