import { RemoteFunction, RemoteFunctionRole } from 'src/util/webextensionRPC'

export interface InPageUIInterface<Role extends RemoteFunctionRole> {
    showSidebar: RemoteFunction<Role, {}>
    openDashboard: RemoteFunction<Role, void>
    updateContextMenuEntries: RemoteFunction<Role, void>
}
