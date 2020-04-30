import GenericPickerLogic, {
    GenericPickerDependencies,
    GenericPickerEvent,
    GenericPickerState,
} from 'src/common-ui/GenericPicker/logic'

export type TagPickerDependencies = GenericPickerDependencies
export type TagPickerEvent = GenericPickerEvent
export type TagPickerState = GenericPickerState

export default class TagPickerLogic extends GenericPickerLogic {
    protected pickerName = 'Tag'
}
