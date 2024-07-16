import { PremiumPlans } from '@worldbrain/memex-common/lib/subscriptions/availablePowerups'
import { RemoteFunction, RemoteFunctionRole } from 'src/util/webextensionRPC'

export interface InPageUIInterface<Role extends RemoteFunctionRole> {
    showSidebar: RemoteFunction<Role, {}>
    openDashboard: RemoteFunction<Role, void>
    getCurrentTabURL: () => Promise<string>
    checkStripePlan: (email: string) => Promise<Record<PremiumPlans, any>>
    updateContextMenuEntries: RemoteFunction<Role, void>
}
