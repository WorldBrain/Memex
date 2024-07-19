import type { Tabs } from 'webextension-polyfill'
import type { ContentScriptComponent } from '../types'
import type { RemoteFunction } from 'src/util/webextensionRPC'
import type { UnifiedAnnotation } from 'src/annotations/cache/types'

export interface ContentScriptsInterface<Role extends 'provider' | 'caller'> {
    injectContentScriptComponent: RemoteFunction<
        Role,
        { component: ContentScriptComponent }
    >
    reloadTab: RemoteFunction<Role, Tabs.ReloadReloadPropertiesType>
    getCurrentTab: RemoteFunction<Role, void, { id: number; url: string }>
    openBetaFeatureSettings: RemoteFunction<
        Role,
        {
            email: string
            userId: string
        },
        {
            status: 'granted' | 'requested'
        }
    >
    openAuthSettings: RemoteFunction<Role, void>
    openPdfInViewer: RemoteFunction<
        Role,
        {
            fullPageUrl: string
        }
    >
    openPageWithSidebarInSelectedListMode: RemoteFunction<
        Role,
        {
            fullPageUrl: string
            sharedListId: string
            manuallyPullLocalListData?: boolean
        }
    >
    goToAnnotationFromDashboardSidebar: RemoteFunction<
        Role,
        {
            fullPageUrl: string
            annotationCacheId: UnifiedAnnotation['unifiedId']
        },
        void
    >
    downloadAudioUrl: RemoteFunction<
        Role,
        {
            url: string
        },
        { array: Float32Array }
    >
}
