import { UILogic, UIEvent } from 'ui-logic-core'
import { Tag } from 'src/tags/background/types'

export const INITIAL_STATE = {
    query: '',
    queryResults: [],
    suggestions: [],
    selectedTags: [],
    loadingQueryResults: false,
    loadingSuggestions: false,
}

export interface TagPickerState {
    query?: string
    queryResults?: Tag[]
    initialTags?: Tag[]
    selectedTags: Tag[]
    loadingSuggestions: boolean
    loadingQueryResults: boolean
}

export type TagPickerEvent = UIEvent<{
    loadedSuggestions: {}
    loadedQueryResults: {}
    tagClicked: {}
    keyPressEnter: {}
    keyPressDown: {}
    keyPressUp: {}
    keyPressOther: {}
    updatedQuery: {}
    updatedTagSelection: {}
    searchInputChanged: { query: string }
    selectedTagPress: { tag: Tag }
}>

export interface TagPickerDependencies {
    onUpdateTagSelection: (tags: Tag[]) => void
    queryTags: (query: string) => Promise<Tag[]>
    loadSuggestions: () => Tag[]
    url: string
    initialSelectedTags?: Tag[]
}

export default class TagPickerLogic extends UILogic<
    TagPickerState,
    TagPickerEvent
> {
    constructor(private dependencies: TagPickerDependencies) {
        super()
    }

    initialTags: Tag[] = []

    getInitialState(): TagPickerState {
        return {
            ...INITIAL_STATE,
            selectedTags: this.dependencies.initialSelectedTags,
        }
    }

    init = async () => {
        this.emitMutation({ loadingSuggestions: { $set: true } })

        this.initialTags = await this.dependencies.loadSuggestions()
        this.emitMutation({
            loadingSuggestions: { $set: false },
            initialTags: { $set: this.initialTags },
        })
    }

    // searchInputChanged = ({ event }) => debounce(150)(() =>this._query(event.query))
    searchInputChanged = ({ event }) => this._query(event.query)

    _removeTagFromList = (tag: Tag, list: Tag[]) =>
        list.filter(t => t.name !== tag.name)

    selectedTagPress = ({ event: { tag }, prevState }) => {
        const selectedTags = this._removeTagFromList(
            tag,
            prevState.selectedTags,
        )
        this.emitMutation({
            selectedTags: { $set: selectedTags },
        })
        this.dependencies.onUpdateTagSelection(selectedTags)
    }

    _query = async (term: string) => {
        const resultsFromInitialTags = this._queryInitialSuggestions(term)
        this.emitMutation({
            queryResults: { $set: resultsFromInitialTags },
        })

        this.emitMutation({ loadingQueryResults: { $set: true } })

        const resultsFromSearch = await this.dependencies.queryTags(term)
        this.emitMutation({
            loadingQueryResults: { $set: false },
            queryResults: { $set: resultsFromSearch },
        })
    }

    _queryInitialSuggestions = term =>
        this.initialTags.filter(tag => tag.name.includes(term))

    static getTagsToDisplay = (state: TagPickerState): Tag[] => {
        if (!state.query) {
            return state.initialTags
        }

        return state.queryResults
    }
}
