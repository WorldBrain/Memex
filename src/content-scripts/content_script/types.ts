export interface ContentScriptRegistry {
    registerRibbonScript(main: () => Promise<void>): Promise<void>
    registerHighlightingScript(main: () => Promise<void>): Promise<void>
    registerSidebarScript(main: () => Promise<void>): Promise<void>
    registerTooltipScript(main: () => Promise<void>): Promise<void>
}
