import { browser } from 'webextension-polyfill-ts'
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

    async bufferPKMSyncItems(itemToBuffer) {
        // Get the current buffer from browser.storage.local
        const data = await browser.storage.local.get('bufferedItems')
        const currentBuffer = data.bufferedItems || []

        // Append the new item to the buffer
        currentBuffer.push(itemToBuffer)

        // Save the updated buffer back to browser.storage.local
        await browser.storage.local.set({ bufferedItems: currentBuffer })
    }

    async processBufferedItems() {
        // Check for buffered items in browser.storage.local
        const data = await browser.storage.local.get('bufferedItems')
        const bufferedItems = data.bufferedItems || []

        // If there are buffered items, send each one
        while (bufferedItems.length > 0) {
            const item = bufferedItems.shift()
            console.log('Processing buffered item', item.fileName)
            await this._writeToPath(
                `Saved Pages/${item.fileName.toString()}.md`,
                JSON.stringify(item.fileContent),
            )
        }

        // Save the emptied buffer back to browser.storage.local
        await browser.storage.local.set({ bufferedItems: bufferedItems })
    }

    async storeObject(fileName: string, fileContent: string): Promise<any> {
        const serverReachable = await this.isConnected()

        if (!serverReachable) {
            const itemToBuffer = {
                fileName: fileName,
                fileContent: fileContent,
            }

            await this.bufferPKMSyncItems(itemToBuffer)
        } else {
            // If the server is reachable, process buffered items first
            await this.processBufferedItems()
        }

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
