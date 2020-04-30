export interface TooltipInteractionInterface {
    showContentTooltip: () => Promise<any>
    insertTooltip: ({ override }?: { override?: boolean }) => any
    removeTooltip: ({ override }?: { override?: boolean }) => any
    insertOrRemoveTooltip: () => Promise<any>
}
