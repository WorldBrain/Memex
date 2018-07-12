import { EventEmitter } from "events"
import { BackupBackend } from "./types"

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
        throw new Error('Not yet implemented  :(')
    }
}
