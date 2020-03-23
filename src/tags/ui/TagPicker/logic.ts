import { UILogic, UIEvent } from 'ui-logic-core'
import { Tag } from 'src/tags/background/types'
import debounce from 'lodash/debounce'

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
    newTagName?: string
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
    // keyPressEnter: {}
    // keyPressDown: {}
    // keyPressUp: {}
    // keyPressOther: {}
    // updatedQuery: {}
    searchInputChanged: { query: string }
    selectedTagPress: { tag: Tag }
    resultTagPress: { tag: Tag }
}>

export interface TagPickerDependencies {
    onUpdateTagSelection: (tags: Tag[]) => void
    queryTags: (query: string) => Promise<Tag[]>
    loadSuggestions: () => Tag[]
    url: string
    initialSelectedTags?: Tag[]
}

interface TagPickerUIEvent<T extends keyof TagPickerEvent> {
    event: TagPickerEvent[T]
    previousState: TagPickerState
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

    searchInputChanged = ({ event }) => {
        this.emitMutation({ query: { $set: event.query } })
        return this._query(event.query)
    }

    _queryBoth = async (term: string) => {
        await this._queryLocal(term)
        await this._queryRemote(term)
    }

    /**
     *  Searches for the term in the initial suggestions provided to the component
     */
    _queryLocal = async (term: string) => {
        const results = this._queryInitialSuggestions(term)
        this.emitMutation({
            queryResults: { $set: results },
        })
        this._setNewTag(results, term)
    }

    /**
     * Searches for the term via the `queryTags` function provided to the component
     */
    _queryRemote = async (term: string) => {
        this.emitMutation({ loadingQueryResults: { $set: true } })
        const results = await this.dependencies.queryTags(term)
        this.emitMutation({
            queryResults: { $set: results },
            loadingQueryResults: { $set: false },
        })
        this._setNewTag(results, term)
    }

    _query = debounce(this._queryBoth, 150)

    /**
     * If the term provided does not exist in the tag list, then set the new tag state to the term.
     * (controls the 'Add a new Tag: ...')
     */
    _setNewTag = (list: Tag[], term: string) => {
        if (this._isTermInTagList(list, term)) {
            this.emitMutation({ newTagName: { $set: null } })
        } else {
            this.emitMutation({ newTagName: { $set: term } })
        }
    }

    /**
     * Loops through a list of tags and exits if a match is found
     */
    _isTermInTagList = (tagList: Tag[], term: string) => {
        for (const tag of tagList) {
            if (tag.name === term) {
                return true
            }
        }
        return false
    }

    _queryInitialSuggestions = term =>
        this.initialTags.filter(tag => tag.name.includes(term))

    selectedTagPress = ({
        event: { tag },
        previousState,
    }: TagPickerUIEvent<'selectedTagPress'>) => {
        this._updateSelectedTags(
            this._removeTagFromList(tag, previousState.selectedTags),
        )
    }

    _removeTagFromList = (tag: Tag, list: Tag[]) =>
        list.filter(t => t.name !== tag.name)

    resultTagPress = ({
        event: { tag },
        previousState,
    }: TagPickerUIEvent<'resultTagPress'>) => {
        this._updateSelectedTags(
            this._addTagToList(tag, previousState.selectedTags),
        )
    }

    _updateSelectedTags = selectedTags => {
        this.emitMutation({
            selectedTags: { $set: selectedTags },
            query: { $set: '' },
        })
        this.dependencies.onUpdateTagSelection(selectedTags)
    }

    _addTagToList = (tag: Tag, list: Tag[]) => {
        list.push(tag)
        return list
    }

    static getTagsToDisplay = (state: TagPickerState): Tag[] => {
        if (!state.query) {
            return state.initialTags
        }

        return state.queryResults
    }
}
