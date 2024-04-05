import { PremiumPlans } from '@worldbrain/memex-common/lib/subscriptions/availablePowerups'
import type { AnnotationInterface } from 'src/annotations/background/types'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import type { ImageSupportInterface } from 'src/image-support/background/types'
import type { RemotePageActivityIndicatorInterface } from 'src/page-activity-indicator/background/types'
import type { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import type { RemoteFunctionRole } from 'src/util/webextensionRPC'

export type GenerateServerID = (collectionName: string) => number | string
export interface LocalExtensionSettings {
    installTimestamp: number
}

export interface OpenTabParams {
    openInSameTab?: boolean
}

export interface RemoteBGScriptInterface {
    openOptionsTab: (query: string, params?: OpenTabParams) => Promise<void>
    openOverviewTab: (
        params?: OpenTabParams & {
            missingPdf?: boolean
            selectedSpace?: number
        },
    ) => Promise<void>
    openLearnMoreTab: (params?: OpenTabParams) => Promise<void>
    confirmBackgroundScriptLoaded: () => Promise<void>
    createCheckoutLink: (
        billingPeriod: 'monthly' | 'yearly',
        selectedPremiumPlans: PremiumPlans[],
        doNotOpen: boolean,
    ) => Promise<void>
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
}
