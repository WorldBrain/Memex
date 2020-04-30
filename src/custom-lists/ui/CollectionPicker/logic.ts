import GenericPickerLogic, {
    GenericPickerDependencies,
    GenericPickerEvent,
    GenericPickerState,
} from 'src/common-ui/GenericPicker/logic'

export type ListPickerDependencies = GenericPickerDependencies
export type ListPickerEvent = GenericPickerEvent
export type ListPickerState = GenericPickerState

export default class CollectionPickerLogic extends GenericPickerLogic {
    protected pickerName = 'Collection'
}
