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

    async listObjects(collection: string): Promise<string[]> {
        const response = await fetch(`${this.url}/${collection}`)
        if (!response.ok) {
            throw new Error(await response.text())
        }

        const body = await response.text()
        const lines = body.split('\n')
        const regex = /href="([^"]+)"/g
        const matches = lines.map(line => regex.exec(line))
        const fileNames = matches
            .filter(match => !!match)
            .map(match => match[1])
        return fileNames
    }

    async retrieveObject(collection: string, object: string) {
        return (await fetch(`${this.url}/${collection}/${object}`)).json()
    }
}
