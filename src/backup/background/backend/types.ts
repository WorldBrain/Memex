import { EventEmitter } from 'events'

export interface BackupObjectLocation {
    collection: string
    pk: string
}

export type BackupObject = BackupObjectLocation & {
    object: object
}

export interface ObjectChange {
    collection: string
    objectPk: string
    object?: any
    operation: 'create' | 'update' | 'delete'
}

export interface ObjectChangeBatch {
    changes: Array<ObjectChange>
    forget: () => Promise<void>
}

export abstract class BackupBackend {
    async getLoginUrl(params: any): Promise<string | null> {
        return null
    }

    abstract isConnected(): Promise<boolean>
    abstract isAuthenticated(): Promise<boolean>

    async handleLoginRedirectedBack(locationHref: string) {
        return
    }

    async startBackup({ events }: { events: EventEmitter }): Promise<any> {
        return
    }
    async commitBackup({ events }: { events: EventEmitter }): Promise<any> {
        return
    }

    async storeObject({
        backupObject,
        events,
    }: {
        backupObject: BackupObject
        events: EventEmitter
    }): Promise<any> {
        // Either implement this and deleteObject(), or implement backupChanges()
    }

    async deleteObject({
        backupObject,
        events,
    }: {
        backupObject: BackupObjectLocation
        events: EventEmitter
    }): Promise<any> {
        // Either implement this and storeObject(), or implement backupChanges()
    }

    async backupChanges({
        changes,
        events,
        currentSchemaVersion,
        options,
    }: {
        changes: ObjectChange[]
        events: EventEmitter
        currentSchemaVersion: number
        options: { storeBlobs: boolean }
    }) {
        for (const change of changes) {
            if (change.operation !== 'delete') {
                await this.storeObject({
                    backupObject: {
                        collection: change.collection,
                        pk: change.objectPk,
                        object: change.object,
                    },
                    events,
                })
            } else {
                await this.deleteObject({
                    backupObject: {
                        collection: change.collection,
                        pk: change.objectPk,
                    },
                    events,
                })
            }
        }
    }
}
