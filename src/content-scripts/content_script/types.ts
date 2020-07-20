import { SharedInPageUIInterface } from 'src/in-page-ui/shared-state/types'
import { RibbonContainerDependencies } from 'src/in-page-ui/ribbon/react/containers/ribbon/types'
import { TooltipDependencies } from 'src/in-page-ui/tooltip/types'
import { Props as SidebarContainerDependencies } from 'src/sidebar/annotations-sidebar/containers/AnnotationsSidebarInPage'
import { HighlightInteractionsInterface } from 'src/highlighting/types'
import AnnotationsManager from 'src/annotations/annotations-manager'
import { BookmarksInterface } from 'src/bookmarks/background/types'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { RemoteTagsInterface } from 'src/tags/background/types'
import { AnnotationInterface } from 'src/direct-linking/background/types'
import { AnnotationsCacheInterface } from 'src/annotations/annotations-cache'
import { HighlightRendererInterface } from 'src/highlighting/ui/highlight-interactions'

export interface ContentScriptRegistry {
    registerRibbonScript(main: RibbonScriptMain): Promise<void>
    registerSidebarScript(main: SidebarScriptMain): Promise<void>
    registerHighlightingScript(main: HighlightsScriptMain): Promise<void>
    registerTooltipScript(main: TooltipScriptMain): Promise<void>
}

export type SidebarScriptMain = (
    dependencies: SidebarContainerDependencies,
) => Promise<void>

export type RibbonScriptMain = (
    options: Omit<
        RibbonContainerDependencies,
        'setSidebarEnabled' | 'getSidebarEnabled'
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

export type HighlightsScriptMain = (
    options: HighlightDependencies,
) => Promise<void>

export type TooltipScriptMain = (
    dependencies: TooltipDependencies,
) => Promise<void>
