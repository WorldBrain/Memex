export interface PkmSyncInterface {
    pushPKMSyncUpdate(item): Promise<void>
}

export interface LocalBackupSettings {
    backendLocation: string
}
