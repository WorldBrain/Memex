import GenericPickerLogic, {
    GenericPickerDependencies,
    GenericPickerEvent,
    GenericPickerState,
} from 'src/common-ui/GenericPicker/logic'

export interface TagPickerDependencies extends GenericPickerDependencies {
    onClickOutside?: React.MouseEventHandler
}

export type TagPickerEvent = GenericPickerEvent
export type TagPickerState = GenericPickerState

export default class TagPickerLogic extends GenericPickerLogic {
    protected pickerName = 'Tag'
}
