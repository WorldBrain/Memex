import { EventEmitter } from "events"

export abstract class BackupBackend {
    async getLoginUrl(params: any): Promise<string | null> {
        return null
    }

    async isAuthenticated() {
        return false
    }

    async handleLoginRedirectedBack(locationHref: string) {
    }

    async startBackup({ events }: { events: EventEmitter }): Promise<any> {
        return
    }
    async commitBackup({ events }: { events: EventEmitter }): Promise<any> {
        return
    }

    abstract storeObject({ collection, pk, object, events }: { collection: string, pk: string, object: object, events: EventEmitter }): Promise<any>
    abstract deleteObject({ collection, pk, events }: { collection: string, pk: string, events: EventEmitter }): Promise<any>
}
