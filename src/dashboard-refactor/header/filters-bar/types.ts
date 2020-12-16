export interface FilterPickerProps {
    onToggleShowPicker: () => void
    initialSelectedEntries: string[]
    onEntriesListUpdate: () => Promise<void>
}
