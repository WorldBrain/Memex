import { RemoteFunction, RemoteFunctionRole } from 'src/util/webextensionRPC'

export interface InPageUIInterface<Role extends RemoteFunctionRole> {
    showSidebar: RemoteFunction<Role, {}>
    openDashboard: RemoteFunction<Role, void>
    getCurrentTabURL: () => Promise<string>
    transcribeAudioUrl: (url: string) => Promise<string>
    checkStripePlan: (email: string) => Promise<void>
    updateContextMenuEntries: RemoteFunction<Role, void>
}
