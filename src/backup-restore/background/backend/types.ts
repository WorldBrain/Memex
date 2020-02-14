import { EventEmitter } from 'events'
import NotificationBackground from 'src/notifications/background'

export interface BackupObjectLocation {
    collection: string
    pk: string
}

export type BackupObject = BackupObjectLocation & {
    object: object
}

export interface ObjectChange<T = any> {
    collection: string
    objectPk: string
    timestamp: number
    object?: T
    operation: 'create' | 'update' | 'delete'
}

export interface ObjectChangeBatch {
    changes: Array<ObjectChange>
    forget: () => Promise<void>
}

export interface ObjectChangeImages {
    screenshot: string
    profilePic: string
}

export abstract class BackupBackend {
    async getLoginUrl(params: any): Promise<string | null> {
        return null
    }

    abstract isConnected(): Promise<boolean>
    abstract isAuthenticated(): Promise<boolean>

    // Is the backend ready to store and retrieve stuff?
    abstract isReachable(): Promise<boolean>

    async handleLoginRedirectedBack(locationHref: string) {
        return
    }

    async startBackup({ events }: { events: EventEmitter }): Promise<any> {
        return
    }
    async commitBackup({ events }: { events: EventEmitter }): Promise<any> {
        return
    }

    async sendNotificationOnFailure(
        id: string,
        notifictions: NotificationBackground,
        backupSize: any,
    ): Promise<string> {
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

    async listObjects(collection: string): Promise<string[]> {
        return null
    }

    async retrieveObject(collection: string, object: string) {
        return null
    }
}
