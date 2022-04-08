import { SharedInPageUIInterface } from 'src/in-page-ui/shared-state/types'
import { RibbonContainerDependencies } from 'src/in-page-ui/ribbon/react/containers/ribbon/types'
import { TooltipDependencies } from 'src/in-page-ui/tooltip/types'
import { Props as SidebarContainerDependencies } from 'src/sidebar/annotations-sidebar/containers/AnnotationsSidebarInPage'
import AnnotationsManager from 'src/annotations/annotations-manager'
import { AnnotationInterface } from 'src/annotations/background/types'
import { AnnotationsCacheInterface } from 'src/annotations/annotations-cache'
import { HighlightRendererInterface } from 'src/highlighting/ui/highlight-interactions'
import { ContentFingerprint } from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import type { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'

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
        'pageUrl' | 'sidebarContext'
    >,
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
    annotationsCache: AnnotationsCacheInterface
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
