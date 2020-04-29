import { UILogic, UIEvent } from 'ui-logic-core'
import debounce from 'lodash/debounce'
import { KeyEvent } from 'src/common-ui/GenericPicker/types'

export const INITIAL_STATE = {
    query: '',
    newTagName: '',
    selectedTags: [],
    loadingQueryResults: false,
    loadingSuggestions: false,
}

export interface TagPickerState {
    query?: string
    newTagName: string
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
    ) => Promise<void>
    queryTags: (query: string) => Promise<string[]>
    tagAllTabs?: (query: string) => Promise<void>
    loadDefaultSuggestions: () => string[] | Promise<string[]>
    initialSelectedTags?: () => Promise<string[]>
    children?: any
}

export type TagPickerEvent = UIEvent<{
    setSearchInputRef: { ref: HTMLInputElement }
    loadedSuggestions: {}
    loadedQueryResults: {}
    tagClicked: {}
    searchInputChanged: { query: string }
    selectedTagPress: { tag: string }
    resultTagAllPress: { tag: DisplayTag }
    newTagAllPress: {}
    resultTagPress: { tag: DisplayTag }
    resultTagFocus: { tag: DisplayTag; index: number }
    newTagPress: { tag: string }
    keyPress: { key: KeyEvent }
    focusInput: {}
}>

interface TagPickerUIEvent<T extends keyof TagPickerEvent> {
    event: TagPickerEvent[T]
    previousState: TagPickerState
}

export default class TagPickerLogic extends UILogic<
    TagPickerState,
    TagPickerEvent
> {
    private searchInputRef?: HTMLInputElement

    constructor(private dependencies: TagPickerDependencies) {
        super()
    }

    private defaultTags: DisplayTag[] = []
    private focusIndex = -1

    // For now, the only thing that needs to know if this has finished, is the tests.
    private _processingUpstreamOperation: Promise<void>
    get processingUpstreamOperation() {
        return this._processingUpstreamOperation
    }
    set processingUpstreamOperation(val) {
        this._processingUpstreamOperation = val
    }

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
        const defaultSuggestions =
            typeof this.dependencies.loadDefaultSuggestions === 'string'
                ? this.dependencies.loadDefaultSuggestions
                : await this.dependencies.loadDefaultSuggestions()

        this.defaultTags = TagPickerLogic.decorateTagList(
            defaultSuggestions,
            initialSelectedTags,
        )

        this.emitMutation({
            loadingSuggestions: { $set: false },
            displayTags: { $set: this.defaultTags },
            selectedTags: { $set: initialSelectedTags },
        })
    }

    setSearchInputRef = ({
        event: { ref },
        previousState,
    }: TagPickerUIEvent<'setSearchInputRef'>) => {
        this.searchInputRef = ref
    }

    focusInput = () => {
        this.searchInputRef?.focus()
    }

    newTabKeys = ['Enter', ',', 'Tab']
    keyPress = ({
        event: { key },
        previousState,
    }: TagPickerUIEvent<'keyPress'>) => {
        if (this.newTabKeys.includes(key)) {
            if (previousState.newTagName !== '' && !(this.focusIndex >= 0)) {
                return this.newTagPress({
                    previousState,
                    event: { tag: previousState.newTagName },
                })
            }

            if (previousState.displayTags[this.focusIndex]) {
                return this.resultTagPress({
                    event: { tag: previousState.displayTags[this.focusIndex] },
                    previousState,
                })
            }
        }

        if (key === 'ArrowUp') {
            if (this.focusIndex > -1) {
                return this._updateFocus(
                    --this.focusIndex,
                    previousState.displayTags,
                )
            }
        }

        if (key === 'ArrowDown') {
            if (this.focusIndex < previousState.displayTags.length - 1) {
                return this._updateFocus(
                    ++this.focusIndex,
                    previousState.displayTags,
                )
            }
        }
    }

    searchInputChanged = async ({
        event: { query },
        previousState,
    }: TagPickerUIEvent<'searchInputChanged'>) => {
        this.emitMutation({
            query: { $set: query },
            // Opportunistically set the new tag name before searching
            newTagName: { $set: query },
        })

        if (!query || query === '') {
            this.emitMutation({
                displayTags: { $set: this.defaultTags },
                query: { $set: '' },
                newTagName: { $set: '' },
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
        results.sort()
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

    _query = debounce(this._queryBoth, 150, { leading: true })

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
                newTagName: { $set: '' },
            })
            // N.B. We update this focus index to this found tag, so that
            // enter keys will action it. But we don't emit that focus
            // to the user, because otherwise the style of the button changes
            // showing the tick and it might seem like it's already selected.
            this._updateFocus(0, displayTags, false)
        } else {
            let tag
            try {
                tag = this._validateTag(term)
            } catch (e) {
                return
            }
            this.emitMutation({
                newTagName: { $set: tag },
            })
            this._updateFocus(-1, displayTags)
        }
    }

    _updateFocus = (
        focusIndex: number | undefined,
        displayTags: DisplayTag[],
        emit = true,
    ) => {
        this.focusIndex = focusIndex ?? -1
        if (!displayTags) {
            return
        }

        for (let i = 0; i < displayTags.length; i++) {
            displayTags[i].focused = focusIndex === i
        }

        emit &&
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

    _queryInitialSuggestions = (term) =>
        this.defaultTags.filter((tag) => tag.name.includes(term))

    selectedTagPress = async ({
        event: { tag },
        previousState,
    }: TagPickerUIEvent<'selectedTagPress'>) => {
        await this._updateSelectedTagState({
            ...this._removeTagSelected(
                tag,
                previousState.displayTags,
                previousState.selectedTags,
            ),
            added: null,
            deleted: tag,
        })
    }

    resultTagPress = async ({
        event: { tag },
        previousState,
    }: TagPickerUIEvent<'resultTagPress'>) => {
        // Here we make the decision to make the tag result list go back to the
        // default suggested tags after an action
        // if this was prevState.displayTags, the tag list would persist.
        const displayTags = this.defaultTags

        if (tag.selected) {
            await this._updateSelectedTagState({
                ...this._removeTagSelected(
                    tag.name,
                    displayTags,
                    previousState.selectedTags,
                ),
                added: null,
                deleted: tag.name,
            })
        } else {
            await this._updateSelectedTagState({
                ...this._addTagSelected(
                    tag.name,
                    displayTags,
                    previousState.selectedTags,
                ),
                added: tag.name,
                deleted: null,
            })
        }
    }

    resultTagAllPress = async ({
        event: { tag },
        previousState,
    }: TagPickerUIEvent<'resultTagPress'>) => {
        // TODO: present feedback to the user?

        const name = this._validateTag(tag.name)
        this._processingUpstreamOperation = this.dependencies.tagAllTabs(name)

        // Note `newTagPres` is used below to ensure when validating that this tag pressed is not
        // already selected. Otherwise the Tag All Tabs might behave strangely - i.e. Unselecting
        // from this page but still tag all the other tabs.
        await this.newTagPress({ event: { tag: name }, previousState })
    }

    newTagAllPress = async ({
        event: {},
        previousState,
    }: TagPickerUIEvent<'newTagAllPress'>) => {
        const tag = this._validateTag(previousState.query)
        await this.newTagPress({ event: { tag: name }, previousState })
        this._processingUpstreamOperation = this.dependencies.tagAllTabs(tag)
    }

    resultTagFocus = ({
        event: { tag, index },
        previousState,
    }: TagPickerUIEvent<'resultTagFocus'>) => {
        this._updateFocus(index, previousState.displayTags)
    }

    newTagPress = async ({
        event: { tag },
        previousState,
    }: TagPickerUIEvent<'newTagPress'>) => {
        tag = this._validateTag(tag)

        if (previousState.selectedTags.includes(tag)) {
            return
        }

        await this._updateSelectedTagState({
            ...this._addTagSelected(
                tag,
                this.defaultTags,
                previousState.selectedTags,
            ),
            added: tag,
            deleted: null,
        })
    }

    _validateTag = (tag: string) => {
        tag = tag.trim()

        if (tag === '') {
            throw Error(`Tag Validation: Can't add tag with only whitespace`)
        }
        return tag
    }

    _updateSelectedTagState = async ({
        displayTags,
        selectedTags = [],
        added,
        deleted,
        skipUpdateCallback,
    }: {
        displayTags: DisplayTag[]
        selectedTags: string[]
        added: string
        deleted: string
        skipUpdateCallback?: boolean
    }) => {
        this.emitMutation({
            query: { $set: '' },
            newTagName: { $set: '' },
            displayTags: { $set: displayTags },
            selectedTags: { $set: selectedTags },
        })

        if (skipUpdateCallback === true) {
            return
        }

        try {
            await this.dependencies.onUpdateTagSelection(
                selectedTags,
                added,
                deleted,
            )
        } catch (e) {
            this._undoAfterError({ displayTags, selectedTags, added, deleted })
            throw e
        }
    }

    async _undoAfterError({ displayTags, selectedTags, added, deleted }) {
        // Reverse the logic skipping the call to run the update callback
        if (added) {
            await this._updateSelectedTagState({
                ...this._removeTagSelected(added, displayTags, selectedTags),
                added: null,
                deleted: added,
                skipUpdateCallback: true,
            })
        } else {
            await this._updateSelectedTagState({
                ...this._addTagSelected(deleted, displayTags, selectedTags),
                added: deleted,
                deleted: null,
                skipUpdateCallback: true,
            })
        }
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
            selectedTags: selectedTags.filter((t) => t !== tag),
        }
    }

    /**
     * Takes a list of tag results and selected tags and combines them to return which tag
     * is selected and which is not.
     */
    static decorateTagList = (
        tagList: string[],
        selectedTags: string[],
    ): DisplayTag[] =>
        tagList.map((tag) => ({
            name: tag,
            focused: false,
            selected: selectedTags?.includes(tag) ?? false,
        }))
}

export interface DisplayTag {
    name: string
    selected: boolean
    focused: boolean
}
