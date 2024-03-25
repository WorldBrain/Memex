import { getPkmSyncKey } from './utils'
import type { Storage } from 'webextension-polyfill'
import type { LocalFolder } from 'src/sidebar/annotations-sidebar/containers/types'

export class MemexLocalBackend {
    constructor(
        private deps: {
            url: string
            storageAPI: Storage.Static
        },
    ) {}

    async isConnected() {
        const syncKey = await getPkmSyncKey(this.deps)

        const body = JSON.stringify({
            syncKey: syncKey,
        })

        try {
            const response = await fetch(`${this.deps.url}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: body,
            })

            if (response.status === 200) {
                return true
            } else if (response.status === 500) {
                return false
            } else {
                return false
            }
        } catch (e) {
            return false
        }
    }
    async isReadyToSync() {
        const syncKey = await getPkmSyncKey(this.deps)

        const body = JSON.stringify({
            syncKey: syncKey,
        })

        try {
            const response = await fetch(`${this.deps.url}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: body,
            })
            if (response.status === 200) {
                return true
            } else if (response.status === 500) {
                return 'not-available'
            } else {
                return false
            }
        } catch (error) {
            console.error('Error in isReadyToSync:', error)
            return false
        }
    }

    async isReachable() {
        return this.isConnected()
    }

    async bufferPKMSyncItems(itemToBuffer) {
        // Get the current buffer from browser.storage.local
        const data = await this.deps.storageAPI.local.get(
            'PKMSYNCbufferedItems',
        )
        const currentBuffer = data.PKMSYNCbufferedItems || []

        if (currentBuffer.length > 2000) {
            await this.deps.storageAPI.local.set({
                PKMSYNCbufferMaxReached: true,
            })
            return
        }

        // Append the new item to the buffer
        currentBuffer.push(itemToBuffer)

        // Save the updated buffer back to browser.storage.local
        await this.deps.storageAPI.local.set({
            PKMSYNCbufferedItems: currentBuffer,
        })
    }

    async getBufferedItems() {
        // Check for buffered items in browser.storage.local
        const data = await this.deps.storageAPI.local.get(
            'PKMSYNCbufferedItems',
        )
        const bufferedItems = data.PKMSYNCbufferedItems || []

        // After retrieving the buffered items, delete them from local storage
        await this.deps.storageAPI.local.remove('PKMSYNCbufferedItems')

        return bufferedItems
    }

    async storeObject(
        fileName: string,
        fileContent: string,
        pkmType: string,
    ): Promise<any> {
        const syncKey = await getPkmSyncKey(this.deps)

        const body = JSON.stringify({
            pageTitle: fileName,
            fileContent: fileContent,
            pkmSyncType: pkmType,
            syncKey: syncKey,
        })

        const response = await fetch(`${this.deps.url}/update-file`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: body,
        })

        if (response.ok) {
            await this.deps.storageAPI.local.set({
                PKMSYNCsyncWasSetupBefore: true,
            })
        }

        if (!response.ok || response.status !== 200) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
    }

    async vectorIndexDocument(document): Promise<any> {
        const syncKey = await getPkmSyncKey(this.deps)
        let body

        if (document.contentType === 'annotation') {
            body = {
                sourceApplication: 'Memex',
                createdWhen: document.createdWhen,
                pageTitle: document.pageTitle,
                creatorId: document.creatorId,
                fullUrl: document.fullUrl,
                contentType: document.contentType,
                fullHTML: document.fullHTML,
                syncKey: syncKey,
            }

            const response = await fetch(`${this.deps.url}/add_annotation`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            })

            if (response.ok) {
            }

            if (!response.ok || response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
        } else {
            body = {
                sourceApplication: 'Memex',
                createdWhen: document.createdWhen,
                pageTitle: document.pageTitle,
                creatorId: document.creatorId,
                fullUrl: document.fullUrl,
                contentType: document.contentType,
                fullHTML: document.fullHTML,
                syncKey: syncKey,
            }

            const response = await fetch(`${this.deps.url}/add_page`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            })

            if (response.ok) {
            }

            if (!response.ok || response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
        }
    }
    async findSimilar(document?, fullUrl?): Promise<any> {
        const syncKey = await getPkmSyncKey(this.deps)

        const body = {
            contentText: document,
            fullUrl: fullUrl,
            syncKey: syncKey,
        }

        try {
            const response = await fetch(`${this.deps.url}/get_similar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            })

            if (response.ok) {
                const responseObj = await response.json()
                return responseObj
            }

            if (response.status === 403) {
                return 'not-allowed'
            }

            if (!response.ok || response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
        } catch (error) {
            return 'not-connected'
        }
    }
    async addFeedSources(
        feedSources: {
            feedUrl: string
            feedTitle: string
            type?: 'substack'
            feedFavIcon?: string
        }[],
    ): Promise<any> {
        const syncKey = await getPkmSyncKey(this.deps)

        const body = JSON.stringify({
            feedSources: feedSources,
            syncKey: syncKey,
        })

        const response = await fetch(`${this.deps.url}/add_feed_source`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: body,
        })

        if (response.ok) {
            const responseObj = await response.json()
            return responseObj
        }

        if (!response.ok || response.status !== 200) {
            throw new Error(`Error getting all RSS feeds: ${response.status}`)
            return 'error'
        }
    }
    async loadFeedSources(): Promise<any> {
        const syncKey = await getPkmSyncKey(this.deps)

        const body = JSON.stringify({
            syncKey: syncKey,
        })

        const response = await fetch(`${this.deps.url}/load_feed_sources`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: body,
        })

        if (response.ok) {
            const responseObj = await response.json()
            return responseObj
        }

        if (!response.ok || response.status !== 200) {
            throw new Error(`Error getting all RSS feeds: ${response.status}`)
        }
    }

    async listObjects(): Promise<string[]> {
        const response = await fetch(`${this.deps.url}/backup/change-sets`)
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
        const syncKey = await getPkmSyncKey(this.deps)

        let body = {
            pageTitle: fileName,
            pkmSyncType: pkmType,
            syncKey: syncKey,
        }

        const response = await fetch(`${this.deps.url}/get-file-content`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        if (response.ok && response.status === 200) {
            const pageContent = await response.text() // or response.text() if the data is plain text
            return pageContent
        }
    }

    async retrieveIndexFile(object: string) {
        return (
            await fetch(`${this.deps.url}/Memex Sync/Memex Sync History.md`)
        ).json()
    }

    async addLocalFolder(): Promise<LocalFolder> {
        const syncKey = await getPkmSyncKey(this.deps)

        const body = JSON.stringify({
            syncKey: syncKey,
        })

        const response = await fetch(`${this.deps.url}/watch_new_folder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: body,
        })

        if (response.ok) {
            const responseObj = await response.json()
            return responseObj
        }

        if (!response.ok || response.status !== 200) {
            throw new Error(
                `Error adding new local folder to watchlist: ${response.status}`,
            )
        }
    }
    async getLocalFolders(): Promise<LocalFolder[]> {
        const syncKey = await getPkmSyncKey(this.deps)

        const body = JSON.stringify({
            syncKey: syncKey,
        })

        const response = await fetch(`${this.deps.url}/fetch_all_folders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: body,
        })

        if (response.ok) {
            const responseObj = await response.json()

            return responseObj
        }

        if (!response.ok || response.status !== 200) {
            throw new Error(
                `Error adding new local folder to watchlist: ${response.status}`,
            )
        }
    }

    async openLocalFile(path: string): Promise<void> {
        const syncKey = await getPkmSyncKey(this.deps)

        const body = JSON.stringify({
            syncKey: syncKey,
            path: path,
        })

        const response = await fetch(`${this.deps.url}/open_file`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: body,
        })

        if (response.ok) {
            const responseObj = await response.json()
            return responseObj
        }

        if (!response.ok || response.status !== 200) {
            throw new Error(`Error opening local file: ${response.status}`)
        }
    }

    async removeFeedSource(feedUrl: string): Promise<void> {
        const syncKey = await getPkmSyncKey(this.deps)

        const body = JSON.stringify({
            syncKey: syncKey,
            feedUrl: feedUrl,
        })

        const response = await fetch(`${this.deps.url}/remove_feed_source`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: body,
        })

        if (response.ok) {
            const responseObj = await response.json()
            return responseObj
        }

        if (!response.ok || response.status !== 200) {
            throw new Error(`Error removing feed source: ${response.status}`)
        }
    }

    async removeLocalFolder(id: number): Promise<void> {
        const syncKey = await getPkmSyncKey(this.deps)

        const body = JSON.stringify({
            syncKey: syncKey,
            id: id,
        })

        const response = await fetch(
            `${this.deps.url}/remove_folder_to_watch`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: body,
            },
        )

        if (response.ok) {
            const responseObj = await response.json()
            return responseObj
        }

        if (!response.ok || response.status !== 200) {
            throw new Error(`Error removing local folder: ${response.status}`)
        }
    }
}
