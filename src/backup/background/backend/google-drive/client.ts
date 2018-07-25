import { DriveTokenManager } from './token-manager'

export class GoogleDriveClient {
    private idCache: { [parentId: string]: { [childName: string]: string } } = {}
    private baseUrl = 'https://www.googleapis.com'

    constructor(private tokenManager: DriveTokenManager) {
    }

    isIdCacheEmpty(parentId) {
        return !this.idCache[parentId]
    }

    async storeObject({ collection, pk, object }: { collection: string, pk: string, object: object }) {
        await this.tokenManager.refreshAccessToken()

        const { id: collectionFolderId, created: folderCreated } = await this.createFolder({ parentId: "appDataFolder", name: collection })
        let fileId = await this.getFolderChildId(collectionFolderId, pk)

        const metadata = {
            name: pk,
            mimeType: 'application/json',
        }
        if (!fileId) {
            metadata['parents'] = [collectionFolderId]
        }

        const uploadUri = `/files${fileId ? `/${fileId}` : ''}?uploadType=resumable`
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
                'Content-Length': serialized.length
            },
            body: serialized
        })

        if (!fileId) {
            this.idCache[collectionFolderId][pk] = 'NEW'
        }
    }

    async deleteObject({ collection, pk }: { collection: string, pk: string }) {
        await this.tokenManager.refreshAccessToken()

        const collectionFolderId = await this.getFolderChildId('appDataFolder', collection)
        if (!collectionFolderId) {
            return
        }

        const fileId = await this.getFolderChildId(collectionFolderId, pk)
        if (!fileId) {
            return
        }

        await this._request(`/files/${fileId}`, {
            method: 'DELETE'
        })
        delete this.idCache[collectionFolderId][pk]
    }

    async cacheFolderContentIDs(parentId: string) {
        const query = parentId !== 'appDataFolder' ? `q=${encodeURIComponent(`'${parentId}' in parents`)}&` : ''
        const entries = <Array<any>>(await this._request(`/files?${query}spaces=appDataFolder`)).files

        if (!this.idCache[parentId]) {
            this.idCache[parentId] = {}
        }
        for (const entry of entries) {
            this.idCache[parentId][entry.name] = entry.id
        }
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

    async createFolder({ parentId, name }: { parentId: string, name: string }) {
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

    async _request(path, options: any = {}): Promise<any> {
        options.headers = options.headers || {}
        options.headers['Authorization'] = `Bearer ${this.tokenManager.accessToken}`

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
        const response = await fetch(url, options)
        return options.json ? await response.json() : response
    }
}
