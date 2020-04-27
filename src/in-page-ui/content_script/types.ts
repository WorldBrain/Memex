export interface InPageUIContentScriptRemoteInterface {
    showSidebar(): Promise<void>
    insertRibbon(): Promise<void>
    removeRibbon(): Promise<void>
    insertTooltip(): Promise<void>
    removeTooltip(): Promise<void>
}
