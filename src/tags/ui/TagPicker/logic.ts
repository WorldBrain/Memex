import { UILogic, UIEvent } from 'ui-logic-core'
import debounce from 'lodash/debounce'
import { KeyboardEvent } from 'react'

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
    queryResults?: string[]
    selectedTags: string[]
    displayTags: DisplayTag[]
    loadingSuggestions: boolean
    loadingQueryResults: boolean
}

export interface TagPickerDependencies {
    onUpdateTagSelection: (tags: string[]) => void
    queryTags: (query: string) => Promise<string[]>
    loadDefaultSuggestions: () => string[]
    url: string
    initialSelectedTags?: string[]
}

export type TagPickerEvent = UIEvent<{
    loadedSuggestions: {}
    loadedQueryResults: {}
    tagClicked: {}
    searchInputChanged: { query: string }
    selectedTagPress: { tag: string }
    resultTagPress: { tag: DisplayTag }
    newTagPress: { tag: string }
    keyPress: { e: KeyboardEvent<any> }
}>

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

    private defaultTags: DisplayTag[] = []
    private inputRef: HTMLTextAreaElement | HTMLInputElement

    getInitialState(): TagPickerState {
        return {
            ...INITIAL_STATE,
            selectedTags: this.dependencies.initialSelectedTags,
            displayTags: [],
        }
    }

    init = async () => {
        this.emitMutation({ loadingSuggestions: { $set: true } })

        this.defaultTags = TagPickerLogic.decorateTagList(
            await this.dependencies.loadDefaultSuggestions(),
            this.dependencies.initialSelectedTags,
        )

        this.emitMutation({
            loadingSuggestions: { $set: false },
            displayTags: { $set: this.defaultTags },
        })
    }

    keyPress = ({
        event: { e },
        previousState,
    }: TagPickerUIEvent<'keyPress'>) => {
        console.log(e)

        if (e.key === 'Enter') {
            // If 'create new tag' is present, action that
            if (previousState.newTagName && previousState.newTagName !== '') {
                this.newTagPress({
                    previousState,
                    event: { tag: previousState.newTagName },
                })
            } else {
                // If search results list is present, action the index item
            }
        }

        if (e.key === 'ArrowUp') {
            // if search results is present, move up index to limit
        }

        if (e.key === 'ArrowDown') {
            // if search results is present, move down index to limit
        }
    }

    searchInputChanged = ({
        event: { query },
        previousState,
    }: TagPickerUIEvent<'searchInputChanged'>) => {
        this.emitMutation({ query: { $set: query } })

        if (query === '') {
            this.emitMutation({
                displayTags: { $set: this.defaultTags },
                query: { $set: query },
            })
            return
        } else {
            this._query(query, previousState.selectedTags)
        }
    }

    _queryBoth = async (term: string, selectedTags: string[]) => {
        // await this._queryLocal(term, selectedTags)
        await this._queryRemote(term, selectedTags)
    }

    // /**
    //  *  Searches for the term in the initial suggestions provided to the component
    //  */
    // _queryLocal = async (term: string, selectedTags: string[]) => {
    //     const results = this._queryInitialSuggestions(term)
    //     const selected
    //     this.emitMutation({
    //         loadingQueryResults: { $set: false },
    //         displayTags: { $set: results },
    //     })
    //     this._setCreateTagDisplay(results, term)
    // }

    /**
     * Searches for the term via the `queryTags` function provided to the component
     */
    _queryRemote = async (term: string, selectedTags: string[]) => {
        this.emitMutation({ loadingQueryResults: { $set: true } })
        const results = await this.dependencies.queryTags(term)
        this.emitMutation({
            loadingQueryResults: { $set: false },
            displayTags: {
                $set: TagPickerLogic.decorateTagList(results, selectedTags),
            },
        })
        this._setCreateTagDisplay(results, term)
    }

    _query = debounce(this._queryBoth, 150)

    /**
     * If the term provided does not exist in the tag list, then set the new tag state to the term.
     * (controls the 'Add a new Tag: ...')
     */
    _setCreateTagDisplay = (list: string[], term: string) => {
        if (this._isTermInTagList(list, term)) {
            this.emitMutation({ newTagName: { $set: null } })
        } else {
            this.emitMutation({ newTagName: { $set: term } })
        }
    }

    /**
     * Loops through a list of tags and exits if a match is found
     */
    _isTermInTagList = (tagList: string[], term: string) => {
        for (const tag of tagList) {
            if (tag === term) {
                return true
            }
        }
        return false
    }

    _queryInitialSuggestions = term =>
        this.defaultTags.filter(tag => tag.name.includes(term))

    selectedTagPress = ({
        event: { tag },
        previousState,
    }: TagPickerUIEvent<'selectedTagPress'>) => {
        this._updateSelectedTagState(
            this._removeTagSelected(
                tag,
                previousState.displayTags,
                previousState.selectedTags,
            ),
        )
    }

    resultTagPress = ({
        event: { tag },
        previousState,
    }: TagPickerUIEvent<'resultTagPress'>) => {
        const result = tag.selected
            ? this._removeTagSelected(
                  tag.name,
                  previousState.displayTags,
                  previousState.selectedTags,
              )
            : this._addTagSelected(
                  tag.name,
                  previousState.displayTags,
                  previousState.selectedTags,
              )
        this._updateSelectedTagState(result)
    }

    newTagPress = ({
        event: { tag },
        previousState,
    }: TagPickerUIEvent<'newTagPress'>) => {
        this._updateSelectedTagState(
            this._addTagSelected(
                tag,
                previousState.displayTags,
                previousState.selectedTags,
            ),
        )
    }

    _updateSelectedTagState = ({
        displayTags,
        selectedTags,
    }: {
        displayTags: DisplayTag[]
        selectedTags: string[]
    }) => {
        this.emitMutation({
            query: { $set: '' },
            newTagName: { $set: '' },
            displayTags: { $set: displayTags },
            selectedTags: { $set: selectedTags },
        })
        this.dependencies.onUpdateTagSelection(selectedTags)
    }

    _addTagSelected = (
        tag: string,
        displayTags: DisplayTag[],
        selectedTags: string[],
    ) => {
        for (const i in displayTags) {
            if (displayTags[i].name === tag) {
                displayTags[i].selected = true
                break
            }
        }

        return {
            displayTags,
            selectedTags: [...selectedTags, tag],
        }
    }

    _removeTagSelected = (
        tag: string,
        displayTags: DisplayTag[],
        selectedTags: string[],
    ) => {
        for (const i in displayTags) {
            if (displayTags[i].name === tag) {
                displayTags[i].selected = false
                break
            }
        }

        return {
            displayTags,
            selectedTags: selectedTags.filter(t => t !== tag),
        }
    }

    /**
     * Takes a list of tag results and selected tags and combines them to return which tag
     * is selected and which is not.
     * Runs through in log time rather than exponential time
     */
    static decorateTagList = (
        tagList: string[],
        selectedTags: string[],
    ): DisplayTag[] => {
        if (selectedTags.length === 0) {
            return tagList.map(t => ({ name: t, selected: false }))
        }

        const displayList = []
        tagList.sort()
        selectedTags.sort()
        for (
            let i = 0, j = 0;
            i < tagList.length && j < selectedTags.length;

        ) {
            if (tagList[i] === selectedTags[j]) {
                displayList[i] = { name: tagList[i], selected: true }
                i++
                j++
            } else {
                displayList[i] = { name: tagList[i], selected: false }
                i++
            }
        }
        return displayList
    }
}

export interface DisplayTag {
    name: string
    selected: boolean
}
