import { SharedInPageUIInterface } from 'src/in-page-ui/shared-state/types'
import { RibbonContainerDependencies } from 'src/in-page-ui/ribbon/react/containers/ribbon/types'
import { TooltipDependencies } from 'src/in-page-ui/tooltip/types'
import { SidebarContainerDependencies } from 'src/sidebar/annotations-sidebar/containers/old/sidebar-annotations/types'

export interface ContentScriptRegistry {
    registerRibbonScript(main: RibbonScriptMain): Promise<void>
    registerSidebarScript(main: SidebarScriptMain): Promise<void>
    registerHighlightingScript(main: HighlightingScriptMain): Promise<void>
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

export type HighlightingScriptMain = () => Promise<void>

export type TooltipScriptMain = (
    dependencies: TooltipDependencies,
) => Promise<void>
