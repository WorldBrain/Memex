export type ContentScript = 'search_injection' | 'in_page_ui'
export interface ContentScriptRegistry {
    registerInPageUIScript(main: () => Promise<void>): Promise<void>
}
