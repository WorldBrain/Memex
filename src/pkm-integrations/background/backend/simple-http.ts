import { BackupObject } from './types'

export class MemexLocalBackend {
    private url

    constructor({ url }: { url: string }) {
        this.url = url
    }

    async isConnected() {
        try {
            const response = await fetch(`${this.url}/status`)
            return response.status === 200
        } catch (e) {
            return false
        }
    }

    async isAuthenticated() {
        // this is for now, until there is some kind of authentication
        return this.isConnected()
    }

    async isReachable() {
        return this.isConnected()
    }

    async storeObject(fileName: string, fileContent: string): Promise<any> {
        console.log('storeObject', fileName, fileContent)
        await this._writeToPath(
            `Saved Pages/${fileName.toString()}.md`,
            JSON.stringify(fileContent),
        )
    }

    async _writeToPath(url: string, body: string) {
        await fetch(`${this.url}/${url}`, {
            method: 'PUT',
            body,
        })
    }

    async listObjects(): Promise<string[]> {
        const response = await fetch(`${this.url}/backup/change-sets`)
        if (response.status === 404) {
            return []
        }
        if (!response.ok) {
            throw new Error(await response.text())
        }

        const body = await response.text()
        if (body.length > 0) {
            const fileNames = body.split(',')
            return fileNames.length > 0 ? fileNames : []
        } else {
            return []
        }
    }

    async retrievePage(object: string) {
        return (await fetch(`${this.url}/Memex Sync/${object}`)).json()
    }

    async retrieveIndexFile(object: string) {
        return (
            await fetch(`${this.url}/Memex Sync/Memex Sync History.md`)
        ).json()
    }
}
