const sorted = require('lodash/sortBy')
import { EventEmitter } from 'events'
import { StorageManager } from '../../../../search/storage/manager'
import { BackupBackend } from '../../backend'
import Interruptable from '../interruptable'
import { DownloadQueue } from './download-queue'

export interface BackupRestoreInfo {
    status: 'preparing' | 'synching'
    totalObjects?: number
    processedObjects: number
}

export class BackupRestoreProcedure {
    storageManager: StorageManager
    backend: BackupBackend

    info?: BackupRestoreInfo
    events?: EventEmitter
    interruptable?: Interruptable

    constructor({
        storageManager,
        backend,
    }: {
        storageManager: StorageManager
        backend: BackupBackend
    }) {
        this.storageManager = storageManager
        this.backend = backend
    }

    get running() {
        return !!this.interruptable
    }

    runner() {
        this.events = new EventEmitter()
        this.interruptable = new Interruptable()

        const procedure = async () => {
            this._updateInfo({ status: 'preparing', processedObjects: 0 })

            try {
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
                    totalObjects:
                        changeSetTimestamps.length + imageTimestamps.length,
                })

                await this.interruptable.execute(() =>
                    this._restoreCollection(
                        'change-sets',
                        changeSetTimestamps,
                        this._writeChange.bind(this),
                    ),
                )
                await this.interruptable.execute(() =>
                    this._restoreCollection(
                        'images',
                        imageTimestamps,
                        this._writeImage.bind(this),
                    ),
                )

                await this._unblockDatabase()
                if (!this.interruptable.cancelled) {
                    this.events.emit('success')
                    return 'success'
                } else {
                    await this._clearDatabase()
                    this.events.emit('cancelled')
                    return 'cancelled'
                }
            } catch (e) {
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

    _clearDatabase() {}
    _blockDatabase() {}

    async _restoreCollection(
        collection: string,
        timestamps: string[],
        writeObject: (object: any) => Promise<any>,
    ) {
        const changeSetDownloadQueue = this._createDownloadQueue(
            collection,
            timestamps,
        )
        await this._restoreFromDownloadQueue(
            changeSetDownloadQueue,
            writeObject,
        )
    }

    async _restoreFromDownloadQueue(
        queue: DownloadQueue,
        writeObject: (object: any) => Promise<any>,
    ) {
        await this.interruptable.whileLoop(
            () => queue.hasNext(),
            async () => {
                const batch = await queue.getNext()
                await this.interruptable.forOfLoop(batch, async change => {
                    await writeObject(change)
                })
                this._updateInfo({
                    processedObjects: this.info.processedObjects + 1,
                })
            },
        )
    }

    _unblockDatabase() {}

    _writeChange(change) {}

    _writeImage(image) {}

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
        this.info = Object.assign({}, this.info, changes)
        this.events.emit('info', this.info)
    }
}
