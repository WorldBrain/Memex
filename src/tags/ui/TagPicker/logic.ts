import { VALID_TAG_PATTERN } from '@worldbrain/memex-common/lib/storage/constants'

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

    validateEntry = (entry: string) => {
        entry = this._validateEntry(entry)

        if (!VALID_TAG_PATTERN.test(entry)) {
            throw Error(
                `${this.pickerName} Validation: Can't add invalid entry`,
            )
        }

        return entry
    }
}
