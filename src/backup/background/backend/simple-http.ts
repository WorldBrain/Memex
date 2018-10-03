const PSON = require('pson')
import { EventEmitter } from 'events'
import {
    BackupBackend,
    BackupObject,
    BackupObjectLocation,
    ObjectChangeBatch,
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
        // console.log('storing object', object)
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
        // const initialDictionary = []
        // const pson = new PSON.ProgressivePair(initialDictionary)
        // const body = pson.encode(changes).buffer
        const body = JSON.stringify(changes, null, 4)
        console.log('!?!!wfqwefewf')

        await fetch(`${this.url}/change-sets/${Date.now()}`, {
            method: 'PUT',
            body,
        })
    }
}
