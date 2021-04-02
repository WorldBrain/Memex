import GenericPickerLogic, {
    GenericPickerDependencies,
    GenericPickerEvent,
    GenericPickerState,
} from 'src/common-ui/GenericPicker/logic'

export interface ListPickerDependencies extends GenericPickerDependencies {
    onSelectedEntriesChange?: (evt: { selectedEntries: string[] }) => void
    onSearchInputChange?: (evt: { query: string }) => void
    loadRemoteListNames: () => Promise<string[]>
    onClickOutside?: React.MouseEventHandler
    searchInputPlaceholder?: string
    removeToolTipText?: string
    query?: string
}

export type ListPickerEvent = GenericPickerEvent
export type ListPickerState = GenericPickerState & {
    remoteLists: Set<string>
}

export default class CollectionPickerLogic extends GenericPickerLogic<
    ListPickerDependencies,
    ListPickerState,
    ListPickerEvent
> {
    protected pickerName = 'Collection'

    validateEntry = this._validateEntry

    getInitialState(): ListPickerState {
        return {
            ...super.getInitialState(),
            remoteLists: new Set(),
        }
    }

    async init() {
        await super.init()

        const lists = await this.dependencies.loadRemoteListNames()
        this.emitMutation({ remoteLists: { $set: new Set(lists) } })
    }
}
