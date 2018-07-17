import * as queryString from 'query-string'
import * as RemoteStorage from 'external/remotestorage'
import { EventEmitter } from "events"
import { BackupBackend } from "./types"

export class RemoteStorageBackend extends BackupBackend {
    private remoteStorage
    private _isAuthenticated = false

    constructor({ apiKeys }) {
        super()

        this.remoteStorage = new (<any>RemoteStorage).default({ cache: false })
        this.remoteStorage.setApiKeys(apiKeys)
        this.remoteStorage.access.claim('worldbrain-memex', 'rw')
        this.remoteStorage.on('connected', () => console.log('rs connected'))
        // this.remoteStorage.on('not-connected', () => console.log('rs not-connected'))

        // this.remoteStorage.on('connected', () => this._isAuthenticated = true)
        // this.remoteStorage.on('disconnected', () => this._isAuthenticated = false)
    }

    async getLoginUrl({ provider, returnURL }: { provider: string, returnURL: string }) {
        const { getLocation: origGetLocation, setLocation: origSetLocation } = RemoteStorage.Authorize

        const location = await new Promise((resolve) => {
            RemoteStorage.Authorize.getLocation = <any>(() => {
                return returnURL
            })
            RemoteStorage.Authorize.setLocation = <any>(location => {
                resolve(location)
            })

            this.remoteStorage.googledrive.connect()
        })

        RemoteStorage.Authorize.getLocation = origGetLocation
        RemoteStorage.Authorize.setLocation = origSetLocation

        return location['href'] || location
    }

    async isAuthenticated() {
        return this._isAuthenticated
    }

    // TODO: Find better name. The back-end redirects back to this URL with some stuff appended.
    async handleLoginRedirectedBack(locationHref: string) {
        const params = queryString.parse(locationHref.split('#')[1])
        const accessToken = params['access_token']
        this.remoteStorage.remote.configure({
            token: accessToken,
        })
    }

    async storeObject({ collection, pk, object, events }: { collection: string, pk: string, object: object, events: EventEmitter }): Promise<any> {
        await this.remoteStorage.put(`${collection}/${pk}`, JSON.stringify(object), 'application/json')
    }

    async deleteObject({ collection, pk, events }: { collection: string, pk: string, events: EventEmitter }): Promise<any> {
        throw new Error('Not yet implemented  :(')
    }
}
