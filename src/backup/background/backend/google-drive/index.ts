import { EventEmitter } from 'events'
import { GoogleDriveClient } from './client'
import { DriveTokenManager, DriveTokenStore } from './token-manager'
import { BackupBackend, ObjectChange } from '../types'
export { LocalStorageDriveTokenStore } from './token-manager'

const DEFAULT_AUTH_SCOPE = 'https://www.googleapis.com/auth/drive.appdata'

export class DriveBackupBackend extends BackupBackend {
    public authUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
    public memexCloudOrigin: string
    private clientId
    private scope
    private client: GoogleDriveClient
    private tokenManager: DriveTokenManager

    constructor({
        tokenStore,
        memexCloudOrigin,
        scope = DEFAULT_AUTH_SCOPE,
    }: {
        tokenStore: DriveTokenStore
        memexCloudOrigin: string
        scope?: string
    }) {
        super()

        this.scope = scope
        this.tokenManager = new DriveTokenManager({
            tokenStore,
            memexCloudOrigin,
        })
        this.client = new GoogleDriveClient(this.tokenManager)
        this.memexCloudOrigin = memexCloudOrigin
    }

    async getLoginUrl({
        provider,
        returnUrl,
    }: {
        provider: string
        returnUrl: string
    }): Promise<string | null> {
        return `${this.memexCloudOrigin}/auth/google?scope=${this.scope}`
    }

    async isAuthenticated() {
        return !!(await this.tokenManager.getAccessToken())
    }

    async isConnected() {
        return (
            !!(await this.tokenManager.getAccessToken()) &&
            !this.tokenManager.isAccessTokenExpired({ margin: 1000 * 60 * 40 })
        )
    }

    async handleLoginRedirectedBack(locationHref: string) {
        const response = await fetch(locationHref)
        const {
            profile,
            accessToken,
            refreshToken,
            expiresInSeconds,
        } = await response.json()
        await this.tokenManager.handleNewTokens({
            accessToken,
            refreshToken,
            expiresInSeconds,
        })
    }

    // async storeObject({
    //     collection,
    //     pk,
    //     object,
    //     events,
    // }: {
    //     collection: string
    //     pk: string
    //     object: object
    //     events: EventEmitter
    // }): Promise<any> {
    //     // await new Promise(resolve => setTimeout(resolve, 3000))
    //     await this.client.storeObject({ collection, pk, object })
    // }

    // async deleteObject({
    //     collection,
    //     pk,
    //     events,
    // }: {
    //     collection: string
    //     pk: string
    //     events: EventEmitter
    // }): Promise<any> {
    //     await this.client.deleteObject({ collection, pk })
    // }

    async backupChanges({
        changes,
        events,
        currentSchemaVersion,
        options,
    }: {
        changes: ObjectChange[]
        events: EventEmitter
        currentSchemaVersion: number
        options: { storeBlobs: boolean }
    }) {
        for (const change of changes) {
            _prepareBackupChangeForStorage(change, options)
        }

        await this.client.storeObject({
            folderName: 'change-sets',
            fileName: Date.now().toString(),
            object: { version: currentSchemaVersion, changes },
        })
    }
}

export function _prepareBackupChangeForStorage(
    change: ObjectChange,
    { storeBlobs }: { storeBlobs: boolean },
) {
    // TODO Jon:
    // if not storeBlobs
    // Strip only screenshots from change.object
    // always
    // encode blobs (favicon and screenshot if applicable)
}
