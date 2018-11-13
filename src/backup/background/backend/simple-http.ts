import { EventEmitter } from 'events'
import {
    BackupBackend,
    BackupObject,
    BackupObjectLocation,
    ObjectChange,
} from './types'

export default class SimpleHttpBackend extends BackupBackend {
    private url

    constructor({ url }: { url: string }) {
        super()

        this.url = url
    }

    async isConnected() {
        return true
    }
    async isAuthenticated() {
        return true
    }

    async storeObject({
        backupObject,
        events,
    }: {
        backupObject: BackupObject
        events: EventEmitter
    }): Promise<any> {
        await fetch(
            `${this.url}/${backupObject.collection}/${encodeURIComponent(
                encodeURIComponent(backupObject.pk),
            )}`,
            {
                method: 'PUT',
                body: JSON.stringify(backupObject.object),
            },
        )
    }

    async deleteObject({
        backupObject,
        events,
    }: {
        backupObject: BackupObjectLocation
        events: EventEmitter
    }): Promise<any> {
        throw new Error('Not yet implemented  :(')
    }

    async backupChanges({
        changes,
        events,
    }: {
        changes: ObjectChange[]
        events: EventEmitter
    }) {
        const body = JSON.stringify(changes, null, 4)

        await fetch(`${this.url}/change-sets/${Date.now()}`, {
            method: 'PUT',
            body,
        })
    }
}
