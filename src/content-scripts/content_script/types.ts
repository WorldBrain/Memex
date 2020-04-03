import { RibbonControllerInterface } from 'src/in-page-ui/ribbon/types'
import { SidebarControllerInterface } from 'src/in-page-ui/sidebar/types'

export interface ContentScriptRegistry {
    registerRibbonScript(
        main: () => Promise<{ ribbonController: RibbonControllerInterface }>,
    ): Promise<void>
    registerSidebarScript(
        main: () => Promise<{
            sidebarController: SidebarControllerInterface
        }>,
    ): Promise<void>
    registerHighlightingScript(main: () => Promise<void>): Promise<void>
    registerTooltipScript(main: () => Promise<void>): Promise<void>
}
