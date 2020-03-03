import { UILogic, UIEvent } from 'ui-logic-core'
import { Tag } from 'src/tags/background/types'
import debounce from 'lodash/fp/debounce'

export const INITIAL_STATE = {
    query: '',
    queryResults: [],
    suggestions: [],
    loadingQueryResults: false,
    loadingSuggestions: false,
}

export interface TagPickerState {
    query?: string
    queryResults?: Tag[]
    initialTags?: Tag[]
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
}>

export interface TagPickerDependencies {
    onUpdateTagSelection: (tags: Tag[]) => void
    queryTags: (query: string) => Tag[]
    initialTags: () => Tag[]
    url: string
}

export default class TagPickerLogic extends UILogic<
    TagPickerState,
    TagPickerEvent
> {
    constructor(private dependencies: TagPickerDependencies) {
        super()
    }

    getInitialState(): TagPickerState {
        return INITIAL_STATE
    }

    init = async () => {
        this.emitMutation({ loadingSuggestions: { $set: true } })
        this.emitMutation({
            loadingSuggestions: { $set: false },
            initialTags: { $set: await this.dependencies.initialTags() },
        })
    }

    searchInputChanged = (term: string) => debounce(150)(this._query)

    _query = async (term: string) => {
        this.emitMutation({ loadingQueryResults: { $set: true } })
        this.emitMutation({
            loadingQueryResults: { $set: false },
            queryResults: { $set: await this.dependencies.queryTags(term) },
        })
    }
}
