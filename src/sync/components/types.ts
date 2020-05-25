export interface SyncDevice {
    deviceId: string
    productType: string
    devicePlatform: string
    createdWhen: Date
}

export class InitialSyncError extends Error {}
