export interface SyncDevice {
    id: string
    name: string
    added: Date
    lastSync?: Date
    initialSync: boolean
}
