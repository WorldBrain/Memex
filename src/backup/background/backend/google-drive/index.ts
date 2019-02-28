import { EventEmitter } from 'events'
import { GoogleDriveClient } from './client'
import { DriveTokenManager, DriveTokenStore } from './token-manager'
import { BackupBackend, ObjectChange } from '../types'
import {
    separateDataFromImageChanges,
    shouldWriteImages,
} from 'src/backup/background/backend/utils'

export { LocalStorageDriveTokenStore } from './token-manager'

export const DEFAULT_AUTH_SCOPE =
    'https://www.googleapis.com/auth/drive.appdata'

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

    async backupChanges({
        changes: unprocessedChanges,
        events,
        currentSchemaVersion,
        options,
    }: {
        changes: ObjectChange[]
        events: EventEmitter
        currentSchemaVersion: number
        options: { storeBlobs: boolean }
    }) {
        const { images, changes } = await separateDataFromImageChanges(
            unprocessedChanges,
        )

        await this.client.storeObject({
            folderName: 'change-sets',
            fileName: Date.now().toString(),
            object: { version: currentSchemaVersion, changes },
        })

        if (shouldWriteImages(images, options.storeBlobs)) {
            await this.client.storeObject({
                folderName: 'images',
                fileName: Date.now().toString(),
                object: { version: currentSchemaVersion, images },
            })
        }
    }

    async listObjects(collection: string): Promise<string[]> {
        await this.tokenManager.refreshAccessToken()
        const collectionFolderId = await this.client.getFolderChildId(
            'appDataFolder',
            collection,
        )
        return Object.keys(await this.client.listFolder(collectionFolderId))
    }

    async retrieveObject(collection: string, object: string) {
        await this.tokenManager.refreshAccessToken()
        const collectionFolderId = await this.client.getFolderChildId(
            'appDataFolder',
            collection,
        )
        const collectionFolderContents = await this.client.listFolder(
            collectionFolderId,
        )
        const objectFileId = collectionFolderContents[object]
        return this.client.getFile(objectFileId, { json: true })
    }
}
