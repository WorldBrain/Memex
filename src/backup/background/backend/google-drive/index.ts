import { EventEmitter } from "events"
import { GoogleDriveClient } from './client'
import { DriveTokenManager, DriveTokenStore } from './token-manager'
export { LocalStorageDriveTokenStore } from './token-manager'

const DEFAULT_AUTH_SCOPE = 'https://www.googleapis.com/auth/drive.appdata'

export class DriveBackupBackend {
    public authUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
    private clientId
    private scope
    private client: GoogleDriveClient
    private tokenManager: DriveTokenManager

    constructor({ clientId, tokenStore, scope = DEFAULT_AUTH_SCOPE }: { clientId: string, tokenStore: DriveTokenStore, scope?: string }) {
        this.clientId = clientId
        this.scope = scope
        this.tokenManager = new DriveTokenManager({ tokenStore })
        this.client = new GoogleDriveClient(this.tokenManager)
    }

    async getLoginUrl({ provider, returnUrl }: { provider: string, returnUrl: string }): Promise<string | null> {
        const hashPos = returnUrl.indexOf('#')
        let url = this.authUrl
        url += this.authUrl.indexOf('?') > 0 ? '&' : '?'
        url += 'redirect_uri=' + encodeURIComponent(returnUrl.replace(/#.*$/, ''))
        url += '&scope=' + encodeURIComponent(this.scope)
        url += '&client_id=' + encodeURIComponent(this.clientId)
        url += '&include_granted_scopes=true'
        if (hashPos !== -1 && hashPos + 1 !== returnUrl.length) {
            url +=
                '&state=' + encodeURIComponent(returnUrl.substring(hashPos + 1))
        }
        url += '&response_type=token'

        return url
    }

    async isAuthenticated() {
        return !!this.tokenManager.accessToken && !this.tokenManager.isAccessTokenExpired({ margin: 1000 * 60 * 40 })
    }

    async isConnected() {
        return !!(await this.tokenManager.tokenStore.retrieveToken('access'))
    }

    async handleLoginRedirectedBack(locationHref: string) {
        await this.tokenManager.handleLoginRedirectedBack(locationHref)
    }

    async startBackup({ events }: { events: EventEmitter }): Promise<any> {
        return
    }
    async commitBackup({ events }: { events: EventEmitter }): Promise<any> {
        return
    }

    async storeObject({ collection, pk, object, events }: { collection: string, pk: string, object: object, events: EventEmitter }): Promise<any> {
        await this.client.storeObject({ collection, pk, object })
    }

    async deleteObject({ collection, pk, events }: { collection: string, pk: string, events: EventEmitter }): Promise<any> {

    }
}
