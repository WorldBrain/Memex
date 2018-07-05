import { EventEmitter } from "events"

export abstract class BackupBackend {
    async startBackup({ events }: { events: EventEmitter }): Promise<any> {

    }
    async commitBackup({ events }: { events: EventEmitter }): Promise<any> {

    }

    abstract storeObject({ collection, pk, object, events }: { collection: string, pk: string, object: object, events: EventEmitter }): Promise<any>
    abstract deleteObject({ collection, pk, events }: { collection: string, pk: string, events: EventEmitter }): Promise<any>
}

export class SimpleHttpBackend extends BackupBackend {
    private url

    constructor({ url }: { url: string }) {
        super()

        this.url = url
    }

    async storeObject({ collection, pk, object, events }: { collection: string, pk: string, object: object, events: EventEmitter }): Promise<any> {
        // console.log('storing object', object)
        await fetch(`${this.url}/${collection}/${encodeURIComponent(encodeURIComponent(pk))}`, {
            method: 'PUT',
            body: JSON.stringify(object)
        })
    }

    async deleteObject({ collection, pk, events }: { collection: string, pk: string, events: EventEmitter }): Promise<any> {

    }
}
