import { RemoteFunction, RemoteFunctionRole } from 'src/util/webextensionRPC'

export interface InPageUIInterface<Role extends RemoteFunctionRole> {
    showSidebar: RemoteFunction<Role, {}>
    updateContextMenuEntries: RemoteFunction<Role, void>
}
