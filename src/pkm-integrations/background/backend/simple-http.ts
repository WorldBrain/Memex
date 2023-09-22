import { browser } from 'webextension-polyfill-ts'
import { BackupObject } from './types'
import { getPkmSyncKey } from './utils'

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
        const data = await browser.storage.local.get('PKMSYNCbufferedItems')
        const currentBuffer = data.PKMSYNCbufferedItems || []

        if (currentBuffer.length > 2000) {
            await browser.storage.local.set({ PKMSYNCbufferMaxReached: true })
            return
        }

        // Append the new item to the buffer
        currentBuffer.push(itemToBuffer)

        // Save the updated buffer back to browser.storage.local
        await browser.storage.local.set({ PKMSYNCbufferedItems: currentBuffer })
    }

    async getBufferedItems() {
        // Check for buffered items in browser.storage.local
        const data = await browser.storage.local.get('PKMSYNCbufferedItems')
        const bufferedItems = data.PKMSYNCbufferedItems || []

        // After retrieving the buffered items, delete them from local storage
        await browser.storage.local.remove('PKMSYNCbufferedItems')

        return bufferedItems
    }

    async storeObject(
        fileName: string,
        fileContent: string,
        pkmType: string,
    ): Promise<any> {
        const serverReachable = await this.isConnected()

        const syncKey = await getPkmSyncKey()

        const body = JSON.stringify({
            pageTitle: fileName,
            fileContent: fileContent,
            pkmSyncType: pkmType,
            syncKey: syncKey,
        })

        const syncWasSetupBefore = await browser.storage.local.get(
            'PKMSYNCsyncWasSetupBefore',
        )
        const syncExists = syncWasSetupBefore.PKMSYNCsyncWasSetupBefore
            ? true
            : false

        if (!serverReachable && syncExists) {
            await this.bufferPKMSyncItems(body)
        } else {
            const bufferedItems = await this.getBufferedItems()

            // Add the current "body" item to the end of the buffered items array
            bufferedItems.push(body)

            // Work off the buffered items one-by-one

            for (const item of bufferedItems) {
                const response = await fetch(`${this.url}/update-file`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: item,
                })

                if (response.ok) {
                    await browser.storage.local.set({
                        PKMSYNCsyncWasSetupBefore: true,
                    })
                }

                if (!response.ok) {
                    await this.bufferPKMSyncItems(body)
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
            }
        }
    }

    async _writeToPath(url: string, body: string, pkmType) {
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

    async retrievePage(fileName: string, pkmType: string) {
        const syncKey = await getPkmSyncKey()

        let body = {
            pageTitle: fileName,
            pkmSyncType: pkmType,
            syncKey: syncKey,
        }

        const response = await fetch(`${this.url}/get-file-content`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const pageContent = await response.text() // or response.text() if the data is plain text
        return pageContent
    }

    async retrieveIndexFile(object: string) {
        return (
            await fetch(`${this.url}/Memex Sync/Memex Sync History.md`)
        ).json()
    }
}
