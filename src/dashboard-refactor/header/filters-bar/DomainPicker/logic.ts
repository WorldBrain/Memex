import { DOMAIN_TLD_PATTERN } from 'src/dashboard-refactor/constants'

import GenericPickerLogic, {
    GenericPickerDependencies,
    GenericPickerEvent,
    GenericPickerState,
} from 'src/common-ui/GenericPicker/logic'

export interface DomainPickerDependencies extends GenericPickerDependencies {
    onClickOutside?: React.MouseEventHandler
}

export type DomainPickerEvent = GenericPickerEvent
export type DomainPickerState = GenericPickerState

export default class DomainPickerLogic extends GenericPickerLogic {
    protected pickerName = 'Domain'

    validateEntry = (entry: string) => {
        entry = this._validateEntry(entry)

        if (!DOMAIN_TLD_PATTERN.test(entry)) {
            throw Error(
                `${this.pickerName} Validation: Can't add invalid entry`,
            )
        }

        return entry
    }
}
