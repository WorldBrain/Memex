import type { PremiumPlans } from '@worldbrain/memex-common/lib/subscriptions/availablePowerups'
import type { AnnotationInterface } from 'src/annotations/background/types'
import type { UnifiedList } from 'src/annotations/cache/types'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import type { ImageSupportInterface } from 'src/image-support/background/types'
import type { RemotePageActivityIndicatorInterface } from 'src/page-activity-indicator/background/types'
import type { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import type {
    RemoteFunctionRole,
    RemoteFunctionWithExtraArgs,
    RemoteFunctionWithoutExtraArgs,
} from 'src/util/webextensionRPC'

export type GenerateServerID = (collectionName: string) => number | string
export interface LocalExtensionSettings {
    installTimestamp: number
}

export interface OpenTabParams {
    openInSameTab?: boolean
}

export interface RemoteBGScriptInterface<Role extends RemoteFunctionRole> {
    openOptionsTab: RemoteFunctionWithoutExtraArgs<
        Role,
        { query: string; params?: OpenTabParams }
    >
    openOverviewTab: RemoteFunctionWithoutExtraArgs<
        Role,
        OpenTabParams & {
            missingPdf?: boolean
            selectedSpace?: number
        }
    >
    createCheckoutLink: RemoteFunctionWithoutExtraArgs<
        Role,
        {
            billingPeriod: 'monthly' | 'yearly'
            selectedPremiumPlans: PremiumPlans[]
            doNotOpen: boolean
            removedPremiumPlans?: PremiumPlans[]
        },
        'error' | 'success'
    >
    broadcastListChangeToAllTabs: RemoteFunctionWithExtraArgs<
        Role,
        | {
              type: 'create'
              list: UnifiedList<'user-list' | 'page-link'>
          }
        | {
              type: 'delete'
              localListId: number
          }
    >
}

// TODO: Fill in this type with remaining BG modules
export interface BackgroundModuleRemoteInterfaces<
    Role extends RemoteFunctionRole
> {
    annotations: AnnotationInterface<Role>
    contentSharing: ContentSharingInterface
    customLists: RemoteCollectionsInterface
    pageActivityIndicator: RemotePageActivityIndicatorInterface
    imageSupport: ImageSupportInterface<Role>
    syncSettings: RemoteSyncSettingsInterface
    bgScript: RemoteBGScriptInterface<Role>
}
