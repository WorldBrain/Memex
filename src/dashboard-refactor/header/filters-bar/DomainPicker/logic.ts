import GenericPickerLogic, {
    GenericPickerDependencies,
    GenericPickerEvent,
    GenericPickerState,
} from 'src/common-ui/GenericPicker/logic'

export interface DomainPickerDependencies extends GenericPickerDependencies {
    query?: string
    removeToolTipText?: string
    searchInputPlaceholder?: string
    onClickOutside?: React.MouseEventHandler
    onSearchInputChange?: (evt: { query: string }) => void
    onSelectedEntriesChange?: (evt: { selectedEntries: string[] }) => void
}

export type DomainPickerEvent = GenericPickerEvent
export type DomainPickerState = GenericPickerState

export default class DomainPickerLogic extends GenericPickerLogic {
    protected pickerName = 'Domain'
    validateEntry = this._validateEntry
}
