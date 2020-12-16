export interface FilterPickerProps {
    query?: string
    initialSelectedEntries: string[]
    queryEntries: (query: string) => Promise<string[]>
    onToggleShowPicker: () => void
    onEntriesListUpdate: () => Promise<void>
    onSearchInputChanged: (evt: { query: string }) => void
    loadDefaultSuggestions: () => string[] | Promise<string[]>
}
