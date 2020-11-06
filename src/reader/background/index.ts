import ReaderStorage from 'src/reader/background/storage'
import StorageManager from '@worldbrain/storex'
import { RemoteReaderInterface } from 'src/reader/types'

export class ReaderBackground {
    storage: ReaderStorage
    remoteFunctions: RemoteReaderInterface

    constructor(
        private options: {
            storageManager: StorageManager
        },
    ) {
        this.storage = new ReaderStorage({
            storageManager: options.storageManager,
        })
        this.remoteFunctions = {
            getReadableVersion: this.storage.getReadable,
            setReadableVersion: this.storage.createReadableIfNotExists,
            readableExists: this.storage.readableExists,
            parseAndSaveReadable: this.storage.parseAndSaveReadable,
        }
    }
}
