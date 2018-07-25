import { EventEmitter } from "events"
import { GoogleDriveClient } from './client'
import { DriveTokenManager, DriveTokenStore } from './token-manager'
export { LocalStorageDriveTokenStore } from './token-manager'

const DEFAULT_AUTH_SCOPE = 'https://www.googleapis.com/auth/drive.appdata'

export class DriveBackupBackend {
    public authUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
    public memexCloudOrigin: string
    private clientId
    private scope
    private client: GoogleDriveClient
    private tokenManager: DriveTokenManager

    constructor(
        { tokenStore, memexCloudOrigin, scope = DEFAULT_AUTH_SCOPE }:
            { tokenStore: DriveTokenStore, memexCloudOrigin: string, scope?: string }
    ) {
        this.scope = scope
        this.tokenManager = new DriveTokenManager({ tokenStore, memexCloudOrigin })
        this.client = new GoogleDriveClient(this.tokenManager)
        this.memexCloudOrigin = memexCloudOrigin
    }

    async getLoginUrl({ provider, returnUrl }: { provider: string, returnUrl: string }): Promise<string | null> {

        // const hashPos = returnUrl.indexOf('#')
        // let url = this.authUrl
        // url += this.authUrl.indexOf('?') > 0 ? '&' : '?'
        // url += 'redirect_uri=' + encodeURIComponent(returnUrl.replace(/#.*$/, ''))
        // url += '&scope=' + encodeURIComponent(this.scope)
        // url += '&client_id=' + encodeURIComponent(this.clientId)
        // url += '&include_granted_scopes=true'
        // if (hashPos !== -1 && hashPos + 1 !== returnUrl.length) {
        //     url +=
        //         '&state=' + encodeURIComponent(returnUrl.substring(hashPos + 1))
        // }
        // url += '&response_type=token'

        return `${this.memexCloudOrigin}/auth/google?scope=${this.scope}`
    }

    async isAuthenticated() {
        return !!this.tokenManager.accessToken && !this.tokenManager.isAccessTokenExpired({ margin: 1000 * 60 * 40 })
    }

    async isConnected() {
        return !!(await this.tokenManager.tokenStore.retrieveAccessToken())
    }

    async handleLoginRedirectedBack(locationHref: string) {
        const response = await fetch(locationHref)
        const { profile, accessToken, refreshToken, expiresInSeconds } = await response.json()
        // console.log({ profile, accessToken, refreshToken, expiresInSeconds })
        await this.tokenManager.handleNewTokens({ accessToken, refreshToken, expiresInSeconds })
    }

    async startBackup({ events }: { events: EventEmitter }): Promise<any> {
        return
    }
    async commitBackup({ events }: { events: EventEmitter }): Promise<any> {
        return
    }

    async storeObject({ collection, pk, object, events }: { collection: string, pk: string, object: object, events: EventEmitter }): Promise<any> {
        // await new Promise(resolve => setTimeout(resolve, 300))
        // if ([].length < 50) return

        await this.client.storeObject({ collection, pk, object })
    }

    async deleteObject({ collection, pk, events }: { collection: string, pk: string, events: EventEmitter }): Promise<any> {

    }
}
