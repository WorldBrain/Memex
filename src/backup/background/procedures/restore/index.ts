const sorted = require('lodash/sortBy')
import { EventEmitter } from 'events'
import { StorageManager } from '../../../../search/storage/manager'
import { BackupBackend } from '../../backend'
import Interruptable from '../interruptable'
import { DownloadQueue } from './download-queue'

export class BackupRestoreProcedure {
    storageManager: StorageManager
    backend: BackupBackend

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
            try {
                await this._clearDatabase()
                await this._blockDatabase()

                await this.interruptable.execute(() =>
                    this._restoreCollection(
                        'change-sets',
                        this._writeChange.bind(this),
                    ),
                )
                await this.interruptable.execute(() =>
                    this._restoreCollection(
                        'images',
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
            }
        }

        return procedure
    }

    _clearDatabase() {}
    _blockDatabase() {}

    async _restoreCollection(
        collection: string,
        writeObject: (object: any) => Promise<any>,
    ) {
        const timestamps = await this._listBackupCollection(collection)
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
}
