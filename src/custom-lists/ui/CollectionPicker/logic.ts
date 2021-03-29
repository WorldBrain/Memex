import GenericPickerLogic, {
    GenericPickerDependencies,
    GenericPickerEvent,
    GenericPickerState,
} from 'src/common-ui/GenericPicker/logic'

export interface ListPickerDependencies extends GenericPickerDependencies {
    onSelectedEntriesChange?: (evt: { selectedEntries: string[] }) => void
    onSearchInputChange?: (evt: { query: string }) => void
    loadCollaborativeListNames: () => Promise<string[]>
    onClickOutside?: React.MouseEventHandler
    searchInputPlaceholder?: string
    removeToolTipText?: string
    query?: string
}

export type ListPickerEvent = GenericPickerEvent
export type ListPickerState = GenericPickerState & {
    collaborativeLists: Set<string>
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
            collaborativeLists: new Set(),
        }
    }

    async init() {
        await super.init()

        const lists = await this.dependencies.loadCollaborativeListNames()
        this.emitMutation({ collaborativeLists: { $set: new Set(lists) } })
    }
}
