import { EventEmitter } from 'events'
import {
    BackupBackend,
    BackupObject,
    BackupObjectLocation,
    ObjectChange,
} from './types'
import {
    separateDataFromImageChanges,
    shouldWriteImages,
} from 'src/backup-restore/background/backend/utils'
import { getPkmSyncKey } from 'src/pkm-integrations/utils'
import type { Storage } from 'webextension-polyfill'

export class MemexLocalBackend extends BackupBackend {
    constructor(
        private deps: {
            url: string
            storageAPI: Storage.Static
        },
    ) {
        super()
    }

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

    async isAuthenticated() {
        // this is for now, until there is some kind of authentication
        return this.isConnected()
    }

    async isReachable() {
        return this.isConnected()
    }

    async storeObject({
        backupObject,
        events,
    }: {
        backupObject: BackupObject
        events: EventEmitter
    }): Promise<any> {
        await this._writeToPath(
            `${backupObject.collection}/${encodeURIComponent(
                encodeURIComponent(backupObject.pk),
            )}`,
            JSON.stringify(backupObject.object),
        )
    }

    async _writeToPath(url: string, body: string) {
        const syncKey = await getPkmSyncKey(this.deps)
        const backupFolder = await this.deps.storageAPI.local.get(
            'PKMSYNCpkmFolders',
        )
        const backupFolderPath = backupFolder.PKMSYNCpkmFolders.backupFolder
        let bodyJSON = JSON.parse(body)
        bodyJSON.syncKey = syncKey
        bodyJSON.backupPath = backupFolderPath
        bodyJSON = JSON.stringify(bodyJSON)

        try {
            const response = await fetch(`${this.deps.url}/${url}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: bodyJSON,
            })

            if (!response.ok) {
                throw new Error(
                    `Failed to write to path: ${response.statusText}`,
                )
            }
        } catch (error) {
            console.error(error)
            throw error
        }
    }

    async deleteObject({
        backupObject,
        events,
    }: {
        backupObject: BackupObjectLocation
        events: EventEmitter
    }): Promise<any> {
        throw new Error('Not yet implemented  :(')
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
        const stringify = (obj) => JSON.stringify(obj, null, 4)
        const { images, changes } = await separateDataFromImageChanges(
            unprocessedChanges,
        )

        const timestamp = Date.now()

        await this._writeToPath(
            `backup/change-sets/${timestamp}`,
            stringify({ version: currentSchemaVersion, changes }),
        )

        if (shouldWriteImages(images, options.storeBlobs)) {
            await this._writeToPath(
                `backup/images/${timestamp}`,
                stringify({ version: currentSchemaVersion, images }),
            )
        }
    }

    async listObjects(collection: string): Promise<string[]> {
        const response = await fetch(`${this.deps.url}/backup/${collection}`)
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

    async retrieveObject(collection: string, object: string) {
        return (
            await fetch(`${this.deps.url}/backup/${collection}/${object}`)
        ).json()
    }
}
