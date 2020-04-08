import { RibbonControllerInterface } from 'src/in-page-ui/ribbon/types'
import { SidebarControllerInterface } from 'src/in-page-ui/sidebar/types'
import { AnnotationsManagerInterface } from 'src/annotations/types'

export interface ContentScriptRegistry {
    registerRibbonScript(main: RibbonScriptMain): Promise<void>
    registerSidebarScript(main: SidebarScriptMain): Promise<void>
    registerHighlightingScript(main: HighlightingScriptMain): Promise<void>
    registerTooltipScript(main: TooltipScriptMain): Promise<void>
}

export type SidebarScriptMain = (dependencies: {
    annotationManager: AnnotationsManagerInterface
}) => Promise<{
    sidebarController: SidebarControllerInterface
}>

export type RibbonScriptMain = () => Promise<{
    ribbonController: RibbonControllerInterface
}>

export type HighlightingScriptMain = () => Promise<void>

export type TooltipScriptMain = () => Promise<void>
