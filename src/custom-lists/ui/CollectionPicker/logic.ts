import GenericPickerLogic, {
    GenericPickerDependencies,
    GenericPickerEvent,
    GenericPickerState,
} from 'src/common-ui/GenericPicker/logic'

export interface ListPickerDependencies extends GenericPickerDependencies {
    onClickOutside?: () => void
}

export type ListPickerEvent = GenericPickerEvent
export type ListPickerState = GenericPickerState

export default class CollectionPickerLogic extends GenericPickerLogic {
    protected pickerName = 'Collection'

    validateEntry = this._validateEntry
}
