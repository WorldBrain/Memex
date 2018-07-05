import { EventEmitter } from "events"

export interface BackupBackend {
    startBackup()
    commitBackup(): EventEmitter

    storeObject({ collection, pk, object }: { collection: string, pk: string, object: object })
    deleteObject({ collection, pk }: { collection: string, pk: string })
}
