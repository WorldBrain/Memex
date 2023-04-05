import type { SharedInPageUIInterface } from 'src/in-page-ui/shared-state/types'
import type { RibbonContainerDependencies } from 'src/in-page-ui/ribbon/react/containers/ribbon/types'
import type { TooltipDependencies } from 'src/in-page-ui/tooltip/types'
import type { Props as SidebarContainerDependencies } from 'src/sidebar/annotations-sidebar/containers/AnnotationsSidebarInPage'
import type AnnotationsManager from 'src/annotations/annotations-manager'
import type { AnnotationInterface } from 'src/annotations/background/types'
import type { HighlightRendererInterface } from '@worldbrain/memex-common/lib/in-page-ui/highlighting/types'
import type { ContentFingerprint } from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import type { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import type { PageAnnotationsCacheInterface } from 'src/annotations/cache/types'
import type { MaybePromise } from 'src/util/types'

export interface ContentScriptRegistry {
    registerRibbonScript(main: RibbonScriptMain): Promise<void>
    registerSidebarScript(main: SidebarScriptMain): Promise<void>
    registerHighlightingScript(main: HighlightsScriptMain): Promise<void>
    registerTooltipScript(main: TooltipScriptMain): Promise<void>
    registerSearchInjectionScript(main: SearchInjectionMain): Promise<void>
}

export type SidebarScriptMain = (
    dependencies: Omit<
        SidebarContainerDependencies,
        'pageUrl' | 'sidebarContext' | 'runtimeAPI' | 'storageAPI'
    > & {
        getFullPageUrl: () => MaybePromise<string>
    },
) => Promise<void>

export type RibbonScriptMain = (
    options: Omit<
        RibbonContainerDependencies,
        'setSidebarEnabled' | 'getSidebarEnabled' | 'currentTab'
    > & {
        inPageUI: SharedInPageUIInterface
    },
) => Promise<void>

export interface HighlightDependencies {
    inPageUI: SharedInPageUIInterface
    highlightRenderer: HighlightRendererInterface
    annotationsManager: AnnotationsManager
    annotations: AnnotationInterface<'caller'>
    annotationsCache: PageAnnotationsCacheInterface
}

export interface SearchInjectionDependencies {
    requestSearcher: any
    syncSettingsBG: RemoteSyncSettingsInterface
}

export type HighlightsScriptMain = (
    options: HighlightDependencies,
) => Promise<void>

export type TooltipScriptMain = (
    dependencies: TooltipDependencies,
) => Promise<void>

export type SearchInjectionMain = (
    dependencies: SearchInjectionDependencies,
) => Promise<void>

export type GetContentFingerprints = () => Promise<ContentFingerprint[]>
