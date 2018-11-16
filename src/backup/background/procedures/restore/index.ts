const sorted = require('lodash/sortBy')
import { EventEmitter } from 'events'
import { StorageManager } from '../../../../search/storage/manager'
import { BackupBackend } from '../../backend'
import { DownloadQueue } from './download-queue'

export class BackupRestoreProcedure {
    storageManager: StorageManager
    backend: BackupBackend

    events?: EventEmitter

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

    // cancel() {

    // }

    runner() {
        this.events = new EventEmitter()

        const procedure = async () => {
            try {
                await this._clearAndBlockDatabase()
                await this._restoreCollection(
                    'change-sets',
                    this._writeChange.bind(this),
                )
                await this._restoreCollection(
                    'images',
                    this._writeImage.bind(this),
                )
                await this._unblockDatabase()
                this.events.emit('success')
            } catch (e) {
                this.events.emit('fail', e)
            }
        }

        return procedure
    }

    _clearAndBlockDatabase() {}

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
        while (queue.hasNext()) {
            const batch = await queue.getNext()
            for (const change of batch) {
                await writeObject(change)
            }
        }
    }

    _unblockDatabase() {}

    _resumeBackupLog() {
        // set lastBackupTime to now
        // maybe schedule backup
    }

    _writeChange(change) {}

    _writeImage(image) {}

    _listBackupCollection(collection: string): any {}

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

    _createBackupObjectFetcher(): any {}
}
