import type { SharedInPageUIInterface } from 'src/in-page-ui/shared-state/types'
import type { RibbonContainerDependencies } from 'src/in-page-ui/ribbon/react/containers/ribbon/types'
import type { TooltipDependencies } from 'src/in-page-ui/tooltip/types'
import type { Props as SidebarContainerDependencies } from 'src/sidebar/annotations-sidebar/containers/AnnotationsSidebarInPage'
import type { AnnotationInterface } from 'src/annotations/background/types'
import type { HighlightRendererInterface } from '@worldbrain/memex-common/lib/in-page-ui/highlighting/types'
import type { ContentFingerprint } from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import type { PageAnnotationsCacheInterface } from 'src/annotations/cache/types'
import type { MaybePromise } from 'src/util/types'
import type { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import type { SearchDisplayProps } from 'src/search-injection/search-display'
import type { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import type { SyncSettingsStore } from 'src/sync-settings/util'
import type { UpgradeModalProps } from 'src/search-injection/upgrade-modal-display'
import { Browser } from 'webextension-polyfill'

export interface ContentScriptRegistry {
    registerRibbonScript(main: RibbonScriptMain): Promise<void>
    registerSidebarScript(main: SidebarScriptMain): Promise<void>
    registerHighlightingScript(main: HighlightsScriptMain): Promise<void>
    registerTooltipScript(main: TooltipScriptMain): Promise<void>
    registerInPageUIInjectionScript(main: InPageUIInjectionsMain): Promise<void>
}

export type SidebarScriptMain = (
    dependencies: Omit<
        SidebarContainerDependencies,
        'pageUrl' | 'sidebarContext' | 'theme'
    > & {
        getFullPageUrl: () => MaybePromise<string>
    },
) => Promise<void>

export type RibbonScriptMain = (
    options: Omit<
        RibbonContainerDependencies,
        | 'setSidebarEnabled'
        | 'getSidebarEnabled'
        | 'currentTab'
        | 'getRootElement'
    > & {
        inPageUI: SharedInPageUIInterface
        analyticsBG: AnalyticsCoreInterface
    },
) => Promise<void>

export interface HighlightDependencies {
    inPageUI: SharedInPageUIInterface
    highlightRenderer: HighlightRendererInterface
    annotations: AnnotationInterface<'caller'>
    annotationsCache: PageAnnotationsCacheInterface
}

export interface InPageUIInjectionsDependencies {
    inPageUI: SharedInPageUIInterface
    searchDisplayProps: SearchDisplayProps
    upgradeModalProps: UpgradeModalProps
    syncSettingsBG: RemoteSyncSettingsInterface
    syncSettings: SyncSettingsStore<
        | 'extension'
        | 'inPageUI'
        | 'activityIndicator'
        | 'openAI'
        | 'searchInjection'
        | 'dashboard'
        | 'betaFeatures'
    >
    annotationsFunctions: any
    transcriptFunctions: any
}

export type HighlightsScriptMain = (
    options: HighlightDependencies,
) => Promise<void>

export type TooltipScriptMain = (
    dependencies: TooltipDependencies,
) => Promise<void>

export type InPageUIInjectionsMain = (
    dependencies: InPageUIInjectionsDependencies,
) => Promise<void>

export type GetContentFingerprints = () => Promise<ContentFingerprint[]>
