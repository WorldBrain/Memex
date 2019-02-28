import * as driveBackup from './backend/google-drive'
import * as localBackup from './backend/simple-http'
import * as backup from '.'
import { browser } from 'webextension-polyfill-ts'
import { BackupBackend } from './backend/types'

export class BackendSelect {
    async restoreBackend(): Promise<BackupBackend> {
        const backendLocation = await this.restoreBackendLocation()
        if (backendLocation === 'local') {
            this.saveBackendLocation('local')
            return this.initLocalBackend()
        } else if (backendLocation === 'google-drive') {
            this.saveBackendLocation('google-drive')
            return this.initGDriveBackend()
        } else {
            return undefined
        }
    }

    async initGDriveBackend(): Promise<BackupBackend> {
        return new driveBackup.DriveBackupBackend({
            tokenStore: new driveBackup.LocalStorageDriveTokenStore({
                prefix: 'drive-token-',
            }),
            memexCloudOrigin: backup._getMemexCloudOrigin(),
        })
    }

    async initLocalBackend(): Promise<BackupBackend> {
        return new localBackup.MemexLocalBackend({
            url: 'http://localhost:11922',
        })
    }

    async restoreBackendLocation(): Promise<string> {
        const storageObject = await browser.storage.local.get('backendInfo')
        if (storageObject.backendInfo) {
            const backendLocation = storageObject.backendInfo.location
            return backendLocation
        } else {
            return undefined
        }
    }

    async saveBackendLocation(location: string): Promise<void> {
        const response = await browser.storage.local.set({
            backendInfo: { location },
        })
        return response
    }
}
