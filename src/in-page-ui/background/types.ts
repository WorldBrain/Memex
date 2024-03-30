import { RemoteFunction, RemoteFunctionRole } from 'src/util/webextensionRPC'

export interface InPageUIInterface<Role extends RemoteFunctionRole> {
    showSidebar: RemoteFunction<Role, {}>
    openDashboard: RemoteFunction<Role, void>
    getCurrentTabURL: RemoteFunction<Role, string>
    checkStripePlan: RemoteFunction<Role, string>
    updateContextMenuEntries: RemoteFunction<Role, void>
}
