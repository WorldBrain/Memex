import { StorageBackendPlugin } from '@worldbrain/storex'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'

export class BackupPlugin extends StorageBackendPlugin<DexieStorageBackend> {
    static QUEUE_CHANGES = 'memex:dexie.queueCollectionChanges'

    install(backend: DexieStorageBackend) {
        super.install(backend)

        backend.registerOperation(
            BackupPlugin.QUEUE_CHANGES,
            this.queueCollectionChanges.bind(this),
        )
    }

    async queueCollectionChanges({
        collections,
        chunkSize = 1000,
    }: {
        collections: string[]
        chunkSize: number
    }) {
        const dexie = this.backend.dexieInstance
        // Change objects are created fast enough that `Date.now()` won't set unique PKs; instead use an inc PK
        let pkIterator = 0

        for (const collection of collections) {
            let chunk = 0
            let pks: any[]
            do {
                pks = await dexie
                    .table(collection)
                    .toCollection()
                    .offset(chunk * chunkSize)
                    .limit(chunkSize)
                    .primaryKeys()

                const changes = pks.map(objectPk => ({
                    timestamp: pkIterator++,
                    operation: 'create',
                    collection,
                    objectPk,
                }))

                await dexie.table('backupChanges').bulkPut(changes)

                chunk++ // Ensure next iteration goes to next chunk
            } while (pks.length === chunkSize) // While data not exhausted
        }
    }
}
