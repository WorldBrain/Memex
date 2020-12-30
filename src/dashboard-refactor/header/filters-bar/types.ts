export interface FilterPickerProps {
    initialSelectedEntries: string[]
    queryEntries: (query: string) => Promise<string[]>
    onToggleShowPicker: () => void
    onSearchInputChange: (evt: { query: string }) => void
    onEntriesListUpdate: () => Promise<void>
    loadDefaultSuggestions: () => string[] | Promise<string[]>
    onSelectedEntriesChange?: (evt: { selectedEntries: string[] }) => void
    searchInputPlaceholder?: string
    removeToolTipText?: string
    query?: string
}
