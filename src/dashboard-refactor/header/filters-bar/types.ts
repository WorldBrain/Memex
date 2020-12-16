export interface FilterPickerProps {
    query?: string
    initialSelectedEntries: string[]
    queryEntries: (query: string) => Promise<string[]>
    onToggleShowPicker: () => void
    onSearchInputChange: (evt: { query: string }) => void
    onEntriesListUpdate: () => Promise<void>
    loadDefaultSuggestions: () => string[] | Promise<string[]>
}
