import * as driveBackup from './backend/google-drive'
import * as localBackup from './backend/simple-http'
import * as backup from '.'
import chrome from 'webextension-polyfill'
import { BackupBackend } from './backend/types'
import type { BrowserSettingsStore } from 'src/util/settings'
import type { LocalBackupSettings } from './types'
import { LOCAL_SERVER_ROOT } from '../ui/backup-pane/constants'

export class BackendSelect {
    serverToTalkTo = LOCAL_SERVER_ROOT
    constructor(
        private deps: {
            localBackupSettings: BrowserSettingsStore<LocalBackupSettings>
        },
    ) {}

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
            localBackupSettings: this.deps.localBackupSettings,
            tokenStore: new driveBackup.LocalStorageDriveTokenStore({
                localBackupSettings: this.deps.localBackupSettings,
                prefix: 'drive-token-',
            }),
            memexCloudOrigin: backup._getMemexCloudOrigin(),
        })
    }

    async initLocalBackend(): Promise<BackupBackend> {
        return new localBackup.MemexLocalBackend({
            url: this.serverToTalkTo,
        })
    }

    async restoreBackendLocation(): Promise<string> {
        const storageObject = await chrome.storage.local.get('backendInfo')
        if (storageObject.backendInfo) {
            const backendLocation = storageObject.backendInfo.location
            return backendLocation
        } else {
            return undefined
        }
    }

    async saveBackendLocation(location: string): Promise<void> {
        const response = await chrome.storage.local.set({
            backendInfo: { location },
        })
        return response
    }
}
