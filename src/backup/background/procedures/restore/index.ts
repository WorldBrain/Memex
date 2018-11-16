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
                await this._restoreChangeSets()
                await this._restoreImages()
                await this._unblockDatabase()
                this.events.emit('success')
            } catch (e) {
                this.events.emit('fail', e)
            }
        }

        return procedure
    }

    _clearAndBlockDatabase() {}

    async _restoreChangeSets() {
        const changeSetTimestamps = await this._listBackupCollection(
            'change-sets',
        )
        const changeSetDownloadQueue = this._createChangeSetDownloadQueue(
            changeSetTimestamps,
        )
        await this._restoreChangeSetsFromDownloadQueue(changeSetDownloadQueue)
    }

    _createChangeSetDownloadQueue(timestamps: string[]) {
        return this._createDownloadQueue('change-sets', timestamps)
    }

    async _restoreChangeSetsFromDownloadQueue(queue: DownloadQueue) {
        while (queue.hasNext()) {
            const batch = await queue.getNext()
            for (const change of batch) {
                this._writeChange(change)
            }
        }
    }

    async _restoreImages() {
        // const imageTimestamps = await this._listBackupCollection('images')
        // const imageDownloadQueue = this._createImageDownloadQueue(imageTimestamps)
        // await this._restoreImagesFromDownloadQueue(imageDownloadQueue)
    }

    _createImageDownloadQueue(timestamps: string[]) {}

    _restoreImagesFromDownloadQueue(queue: DownloadQueue) {}

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
