import { UILogic, UIEvent } from 'ui-logic-core'
import debounce from 'lodash/debounce'
import { KeyboardEvent } from 'react'

export const INITIAL_STATE = {
    query: '',
    suggestions: [],
    selectedTags: [],
    loadingQueryResults: false,
    loadingSuggestions: false,
}

export interface TagPickerState {
    query?: string
    newTagName?: string
    selectedTags: string[]
    displayTags: DisplayTag[]
    loadingSuggestions: boolean
    loadingQueryResults: boolean
}

export interface TagPickerDependencies {
    onUpdateTagSelection: (
        tags: string[],
        added: string,
        deleted: string,
    ) => void
    queryTags: (query: string) => Promise<string[]>
    loadDefaultSuggestions: () => string[]
    url: string
    initialSelectedTags?: () => Promise<string[]>
}

export type TagPickerEvent = UIEvent<{
    loadedSuggestions: {}
    loadedQueryResults: {}
    tagClicked: {}
    searchInputChanged: { query: string }
    selectedTagPress: { tag: string }
    resultTagPress: { tag: DisplayTag }
    resultTagFocus: { tag: DisplayTag }
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
    private focusIndex = -1
    private inputRef: HTMLTextAreaElement | HTMLInputElement

    getInitialState(): TagPickerState {
        return {
            ...INITIAL_STATE,
            selectedTags: [],
            displayTags: [],
        }
    }

    init = async () => {
        this.emitMutation({ loadingSuggestions: { $set: true } })

        const initialSelectedTags = await this.dependencies.initialSelectedTags()

        this.defaultTags = TagPickerLogic.decorateTagList(
            await this.dependencies.loadDefaultSuggestions(),
            initialSelectedTags,
        )

        this.emitMutation({
            loadingSuggestions: { $set: false },
            displayTags: { $set: this.defaultTags },
            selectedTags: { $set: initialSelectedTags },
        })
    }

    keyPress = ({
        event: { e },
        previousState,
    }: TagPickerUIEvent<'keyPress'>) => {
        if (e.key === 'Enter') {
            if (
                this.focusIndex >= 0 &&
                previousState.displayTags[this.focusIndex]
            ) {
                this.resultTagPress({
                    event: { tag: previousState.displayTags[this.focusIndex] },
                    previousState,
                })
            } else {
                if (
                    previousState.newTagName &&
                    previousState.newTagName !== ''
                ) {
                    this.newTagPress({
                        previousState,
                        event: { tag: previousState.newTagName },
                    })
                }
            }
        }

        if (e.key === 'ArrowUp') {
            if (this.focusIndex > -1) {
                this._updateFocus(--this.focusIndex, previousState.displayTags)
            }
        }

        if (e.key === 'ArrowDown') {
            if (this.focusIndex < previousState.displayTags.length - 1) {
                this._updateFocus(++this.focusIndex, previousState.displayTags)
            }
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
        } else {
            return this._query(query, previousState.selectedTags)
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
        const displayTags = TagPickerLogic.decorateTagList(
            results,
            selectedTags,
        )
        this.emitMutation({
            loadingQueryResults: { $set: false },
            displayTags: {
                $set: displayTags,
            },
        })
        this._setCreateTagDisplay(results, displayTags, term)
    }

    // _query = debounce(this._queryBoth, 150)
    _query = this._queryBoth

    /**
     * If the term provided does not exist in the tag list, then set the new tag state to the term.
     * (controls the 'Add a new Tag: ...')
     */
    _setCreateTagDisplay = (
        list: string[],
        displayTags: DisplayTag[],
        term: string,
    ) => {
        if (this._isTermInTagList(list, term)) {
            this.emitMutation({
                newTagName: { $set: null },
            })
            this._updateFocus(0, displayTags)
        } else {
            this.emitMutation({
                newTagName: { $set: term },
            })
            this._updateFocus(-1, displayTags)
        }
    }

    _updateFocus = (focusIndex: number, displayTags: DisplayTag[]) => {
        this.focusIndex = focusIndex
        if (!displayTags) {
            return
        }

        for (let i = 0; i < displayTags.length; i++) {
            displayTags[i].focused = focusIndex === i
        }

        this.emitMutation({
            displayTags: { $set: displayTags },
        })
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
        this._updateSelectedTagState({
            ...this._removeTagSelected(
                tag,
                previousState.displayTags,
                previousState.selectedTags,
            ),
            added: null,
            deleted: tag,
        })
    }

    resultTagPress = ({
        event: { tag },
        previousState,
    }: TagPickerUIEvent<'resultTagPress'>) => {
        if (tag.selected) {
            this._updateSelectedTagState({
                ...this._removeTagSelected(
                    tag.name,
                    previousState.displayTags,
                    previousState.selectedTags,
                ),
                added: null,
                deleted: tag.name,
            })
        } else {
            this._updateSelectedTagState({
                ...this._addTagSelected(
                    tag.name,
                    previousState.displayTags,
                    previousState.selectedTags,
                ),
                added: tag.name,
                deleted: null,
            })
        }
    }

    resultTagFocus = ({
        event: { tag },
        previousState,
    }: TagPickerUIEvent<'resultTagFocus'>) => {
        this._updateFocus(tag.index, previousState.displayTags)
    }

    newTagPress = ({
        event: { tag },
        previousState,
    }: TagPickerUIEvent<'newTagPress'>) => {
        this._updateSelectedTagState({
            ...this._addTagSelected(
                tag,
                previousState.displayTags,
                previousState.selectedTags,
            ),
            added: tag,
            deleted: null,
        })
    }

    _updateSelectedTagState = ({
        displayTags,
        selectedTags = [],
        added,
        deleted,
    }: {
        displayTags: DisplayTag[]
        selectedTags: string[]
        added: string
        deleted: string
    }) => {
        this.emitMutation({
            query: { $set: '' },
            newTagName: { $set: '' },
            displayTags: { $set: displayTags },
            selectedTags: { $set: selectedTags },
        })
        this.dependencies.onUpdateTagSelection(selectedTags, added, deleted)
    }

    _addTagSelected = (
        tag: string,
        displayTags: DisplayTag[],
        selectedTags: string[] = [],
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
        selectedTags: string[] = [],
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
        if (selectedTags?.length ?? 0 === 0) {
            let index = 0
            return tagList.map(t => ({
                index: index++,
                name: t,
                selected: false,
                focused: false,
            }))
        }

        const displayList = []
        tagList.sort()
        selectedTags.sort()
        for (
            let i = 0, j = 0;
            i < tagList.length && j < selectedTags.length;

        ) {
            if (tagList[i] === selectedTags[j]) {
                displayList[i] = {
                    index: i,
                    name: tagList[i],
                    selected: true,
                    focused: false,
                }
                i++
                j++
            } else {
                displayList[i] = {
                    index: i,
                    name: tagList[i],
                    selected: false,
                    focused: false,
                }
                i++
            }
        }
        return displayList
    }
}

export interface DisplayTag {
    index: number
    name: string
    selected: boolean
    focused: boolean
}
