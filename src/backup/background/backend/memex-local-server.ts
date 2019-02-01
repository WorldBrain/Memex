import { EventEmitter } from 'events'
import {
    BackupBackend,
    BackupObject,
    BackupObjectLocation,
    ObjectChange,
} from './types'

export class MemexLocalBackend extends BackupBackend {
    private url

    constructor({ url }: { url: string }) {
        super()

        this.url = url
    }

    async isConnected() {
        try {
            const response = await fetch(`${this.url}/status`)
            console.log(response.status)
            return response.status === 200
        } catch (err) {
            console.error(err)
        }

        return false
    }

    async isAuthenticated() {
        // this is for now, until there is some kind of authentication
        return this.isConnected()
    }

    async storeObject({
        backupObject,
        events,
    }: {
        backupObject: BackupObject
        events: EventEmitter
    }): Promise<any> {
        await fetch(
            `${this.url}/backup/${backupObject.collection}/${encodeURIComponent(
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
        currentSchemaVersion,
    }: {
        changes: ObjectChange[]
        events: EventEmitter
        currentSchemaVersion: number
    }) {
        const body = JSON.stringify(
            { version: currentSchemaVersion, changes },
            null,
            4,
        )

        await fetch(`${this.url}/backup/change-sets/${Date.now()}`, {
            method: 'PUT',
            body,
        })
    }

    async listObjects(collection: string): Promise<string[]> {
        const response = await fetch(`${this.url}/backup/${collection}`)
        if (response.status === 404) {
            return []
        }
        if (!response.ok) {
            throw new Error(await response.text())
        }
        const body = await response.text()
        if (body.length > 0) {
            const fileNames = body.split(',')
            return fileNames.length > 0 ? fileNames : []
        } else {
            return []
        }
    }

    async retrieveObject(collection: string, object: string) {
        return (await fetch(
            `${this.url}/backup/${collection}/${object}`,
        )).json()
    }
}
