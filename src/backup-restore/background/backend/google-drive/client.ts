import { DriveTokenManager } from './token-manager'
import { setLocalStorageTyped } from 'src/util/storage'
import { retryUntil } from 'src/util/retry-until'

export class GoogleDriveClient {
    private idCache: {
        [parentId: string]: { [childName: string]: string }
    } = {}
    private baseUrl = 'https://www.googleapis.com'

    constructor(private tokenManager: DriveTokenManager) {}

    isIdCacheEmpty(parentId) {
        return !this.idCache[parentId]
    }

    async storeObject({
        folderName,
        fileName,
        object,
    }: {
        folderName: string
        fileName: string
        object: object
    }) {
        await this.tokenManager.refreshAccessToken()

        const {
            id: collectionFolderId,
            created: folderCreated,
        } = await this.createFolder({
            parentId: 'appDataFolder',
            name: folderName,
        })
        const fileId = await this.getFolderChildId(collectionFolderId, fileName)

        const metadata = {
            name: fileName,
            mimeType: 'application/json',
        }
        if (!fileId) {
            metadata['parents'] = [collectionFolderId]
        }

        const uploadUri = `/files${
            fileId ? `/${fileId}` : ''
        }?uploadType=resumable`
        const response = await this._request(uploadUri, {
            prefix: 'upload',
            json: false,
            method: !fileId ? 'POST' : 'PATCH',
            body: JSON.stringify(metadata),
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
        })

        const serialized = JSON.stringify(object)
        await this._request(response.headers.get('Location'), {
            prefix: null,
            json: false,
            method: !fileId ? 'PUT' : 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': serialized.length,
            },
            body: serialized,
        })

        if (!fileId) {
            this.idCache[collectionFolderId][fileName] = 'NEW'
        }
    }

    async deleteObject({
        folderName,
        fileName,
    }: {
        folderName: string
        fileName: string
    }) {
        await this.tokenManager.refreshAccessToken()

        const collectionFolderId = await this.getFolderChildId(
            'appDataFolder',
            folderName,
        )
        if (!collectionFolderId) {
            return
        }

        const fileId = await this.getFolderChildId(collectionFolderId, fileName)
        if (!fileId) {
            return
        }

        await this._request(`/files/${fileId}`, {
            method: 'DELETE',
        })
        delete this.idCache[collectionFolderId][fileName]
    }

    async cacheFolderContentIDs(parentId: string) {
        let nextPageToken = null
        do {
            let query = ''
            if (parentId !== 'appDataFolder') {
                query += `q=${encodeURIComponent(`'${parentId}' in parents`)}&`
            }
            if (nextPageToken) {
                query += `pageToken=${nextPageToken}&`
            }

            const response = await this._request(
                `/files?${query}spaces=appDataFolder`,
            )
            const entries = response.files as Array<any>
            nextPageToken = response.nextPageToken

            if (!this.idCache[parentId]) {
                this.idCache[parentId] = {}
            }
            for (const entry of entries) {
                this.idCache[parentId][entry.name] = entry.id
            }
        } while (nextPageToken)
    }

    async getFolderChildId(parentId: string, childName: string) {
        if (!this.idCache[parentId]) {
            await this.cacheFolderContentIDs(parentId)
        }

        let childId = this.idCache[parentId][childName]
        if (childId === 'NEW') {
            await this.cacheFolderContentIDs(parentId)
            childId = this.idCache[parentId][childName]
        }

        return childId
    }

    async listFolder(parentId: string) {
        await this.cacheFolderContentIDs(parentId)
        return this.idCache[parentId]
    }

    async getFile(fileId: string, options: { json?: boolean } = {}) {
        const response = await this._request(`/files/${fileId}?alt=media`, {
            method: 'GET',
            json: options.json,
        })
        return response
    }

    async createFolder({ parentId, name }: { parentId: string; name: string }) {
        if (this.isIdCacheEmpty(parentId)) {
            await this.cacheFolderContentIDs(parentId)
        }
        if (this.idCache[parentId][name]) {
            return { id: this.idCache[parentId][name], created: false }
        }
        const response = await this._request(`/files`, {
            method: 'POST',
            body: JSON.stringify({
                name,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [parentId],
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        })
        this.idCache[parentId][name] = response.id
        this.idCache[response.id] = {}
        return { id: response.id, created: true }
    }

    // https://developers.google.com/drive/api/v3/reference/about
    async getDriveStorageQuota() {
        const response = await this._request(`/about?fields=storageQuota`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        return response.storageQuota
    }

    async _request(path, options: any = {}): Promise<any> {
        const accessToken = await this.tokenManager.getAccessToken()
        options.headers = options.headers || {}
        options.headers['Authorization'] = `Bearer ${accessToken}`

        if (options.prefix === undefined) {
            options.prefix = 'main'
        }
        if (options.json === undefined) {
            options.json = true
        }

        let baseUrl = ''
        if (options.prefix !== null) {
            baseUrl = this.baseUrl
        }
        if (options.prefix === 'main') {
            baseUrl += '/drive/v3'
        } else if (options.prefix === 'upload') {
            baseUrl += '/upload/drive/v3'
        }
        delete options.prefix

        const url = baseUrl + path
        const response = await retryUntil(
            () => fetch(url, options),
            (res) => {
                if (res.status === 500) {
                    console.error(
                        'Received server error from Drive, retrying',
                        res,
                    )
                    return false
                }
                return true
            },
            {
                intervalMiliseconds: 1000,
                timeoutMiliseconds: 10000,
            },
        )

        if (!response.ok) {
            console.error(
                'Something went wrong making a request to Drive:',
                response,
            )
            await setLocalStorageTyped('backup-status', {
                state: 'fail',
                backupId: 'drive_size_empty',
            })
            throw new Error('Error during request to Drive')
        }
        return options.json ? response.json() : response
    }
}
