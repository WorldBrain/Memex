import { PickerUpdateHandler } from 'src/common-ui/GenericPicker/types'

export interface FilterPickerProps {
    initialSelectedEntries: string[]
    onUpdateEntrySelection: PickerUpdateHandler
    onToggleShowPicker: () => void
}
