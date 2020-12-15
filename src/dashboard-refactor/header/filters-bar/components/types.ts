export interface FilterPickerProps {
    onToggleShowPicker: () => void
    initialSelectedEntries: string[]
    onEntriesListUpdate: () => Promise<void>
    queryEntries: (query: string) => Promise<string[]>
    loadDefaultSuggestions: () => string[] | Promise<string[]>
}
