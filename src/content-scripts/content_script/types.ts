import { AnnotationsManagerInterface } from 'src/annotations/types'
import { HighlightInteractionInterface } from 'src/highlighting/types'
import { InPageUIInterface } from 'src/in-page-ui/shared-state/types'
import { RibbonContainerDependencies } from 'src/in-page-ui/ribbon/react/containers/ribbon/types'

export interface ContentScriptRegistry {
    registerRibbonScript(main: RibbonScriptMain): Promise<void>
    registerSidebarScript(main: SidebarScriptMain): Promise<void>
    registerHighlightingScript(main: HighlightingScriptMain): Promise<void>
    registerTooltipScript(main: TooltipScriptMain): Promise<void>
}

export type SidebarScriptMain = (dependencies: {
    inPageUI: InPageUIInterface
    annotationsManager: AnnotationsManagerInterface
    currentTab: { id: number; url: string }
    highlighter: HighlightInteractionInterface
    getRemoteFunction: (name: string) => (...args: any[]) => Promise<any>
}) => Promise<void>

export type RibbonScriptMain = (
    options: Omit<
        RibbonContainerDependencies,
        'setSidebarEnabled' | 'getSidebarEnabled'
    > & {
        inPageUI: InPageUIInterface
    },
) => Promise<void>

export type HighlightingScriptMain = () => Promise<void>

export type TooltipScriptMain = () => Promise<void>
