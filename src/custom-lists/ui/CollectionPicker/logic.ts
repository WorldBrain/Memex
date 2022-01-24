import GenericPickerLogic, {
    GenericPickerDependencies,
    GenericPickerEvent,
    GenericPickerState,
} from 'src/common-ui/GenericPicker/logic'
import type { DisplayEntry } from 'src/common-ui/GenericPicker/types'

export interface ListPickerDependencies
    extends GenericPickerDependencies<ListDisplayEntry> {
    onClickOutside?: React.MouseEventHandler
}

export interface ListDisplayEntry extends DisplayEntry {
    localId: number
    remoteId: string | null
    createdAt: number
}

export type ListPickerEvent = GenericPickerEvent<ListDisplayEntry>
export type ListPickerState = GenericPickerState<ListDisplayEntry>

export default class CollectionPickerLogic extends GenericPickerLogic<
    ListDisplayEntry,
    ListPickerDependencies,
    ListPickerState,
    ListPickerEvent
> {
    protected pickerName = 'Spaces'

    validateEntry = this._validateEntry

    constructor(protected dependencies: ListPickerDependencies) {
        super({
            ...dependencies,
            getEntryDisplayField: (e) => e.name,
            getEntryIdField: (e) => e.localId,
        })
    }
}
