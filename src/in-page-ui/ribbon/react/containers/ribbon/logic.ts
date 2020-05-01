import debounce from 'lodash/debounce'
import { UILogic, UIEvent, UIEventHandler } from 'ui-logic-core'
import { RibbonContainerDependencies } from './types'
import * as componentTypes from '../../components/types'
import { InPageUIInterface } from 'src/in-page-ui/shared-state/types'
import { TaskState } from 'ui-logic-core/lib/types'
import { loadInitial } from 'src/util/ui-logic'

export type PropKeys<Base, ValueCondition> = keyof Pick<
    Base,
    {
        [Key in keyof Base]: Base[Key] extends ValueCondition ? Key : never
    }[keyof Base]
>
type ValuesOf<Props> = Omit<Props, PropKeys<Props, Function>> // tslint:disable-line
type HandlersOf<Props> = {
    [Key in PropKeys<Props, Function>]: Props[Key] extends (
        // tslint:disable-line
        value: infer Arg,
    ) => void
        ? { value: Arg }
        : null
}
type SubcomponentHandlers<
    Subcomponent extends keyof componentTypes.RibbonSubcomponentProps
> = HandlersOf<componentTypes.RibbonSubcomponentProps[Subcomponent]>

export interface RibbonContainerState {
    loadState: TaskState
    isRibbonEnabled: boolean | null

    highlights: ValuesOf<componentTypes.RibbonHighlightsProps>
    tooltip: ValuesOf<componentTypes.RibbonTooltipProps>
    // sidebar: ValuesOf<componentTypes.RibbonSidebarProps>
    commentBox: Omit<
        ValuesOf<componentTypes.RibbonCommentBoxProps>,
        'initTagSuggestions'
    >
    bookmark: ValuesOf<componentTypes.RibbonBookmarkProps>
    tagging: ValuesOf<componentTypes.RibbonTaggingProps>
    lists: ValuesOf<componentTypes.RibbonListsProps>
    search: ValuesOf<componentTypes.RibbonSearchProps>
    pausing: ValuesOf<componentTypes.RibbonPausingProps>
}

export type RibbonContainerEvents = UIEvent<
    {
        show: null
        hide: null
        toggleRibbon: null
    } & SubcomponentHandlers<'highlights'> &
        SubcomponentHandlers<'tooltip'> &
        // SubcomponentHandlers<'sidebar'> &
        SubcomponentHandlers<'commentBox'> &
        SubcomponentHandlers<'bookmark'> &
        SubcomponentHandlers<'tagging'> &
        SubcomponentHandlers<'lists'> &
        SubcomponentHandlers<'search'> &
        SubcomponentHandlers<'pausing'>
>

export interface RibbonContainerOptions extends RibbonContainerDependencies {
    inPageUI: InPageUIInterface
}

type EventHandler<
    EventName extends keyof RibbonContainerEvents
> = UIEventHandler<RibbonContainerState, RibbonContainerEvents, EventName>

const INITIAL_COMMENT_BOX_STATE = {
    commentText: '',
    showCommentBox: false,
    isCommentSaved: false,
    isCommentBookmarked: false,
    isAnnotation: false,
    isTagInputActive: false,
    showTagsPicker: false,
    tags: [],
    tagSuggestions: [],
}
export class RibbonContainerLogic extends UILogic<
    RibbonContainerState,
    RibbonContainerEvents
>
// implements UIEventHandlers<RibbonContainerState, RibbonContainerEvents>
{
    debouncedFetchTagSuggestions: (search: string) => Promise<string[]>

    constructor(private dependencies: RibbonContainerOptions) {
        super()

        let sugCounter = 0
        this.debouncedFetchTagSuggestions = debounce(() => {
            // TODO: Actually fetch tag suggestions
            return [`sug ${++sugCounter}`, `sug ${++sugCounter}`]
        }, 300)

        // TODO: Load page tags & lists when necessary (on ribbon show?)
    }

    getInitialState(): RibbonContainerState {
        return {
            loadState: 'pristine',
            isRibbonEnabled: null,
            highlights: {
                areHighlightsEnabled: false,
            },
            tooltip: {
                isTooltipEnabled: false,
            },
            // sidebar: {
            //     isSidebarOpen: false,
            // },
            commentBox: INITIAL_COMMENT_BOX_STATE,
            bookmark: {
                isBookmarked: false,
            },
            tagging: {
                showTagsPicker: false,
                tags: [],
                initTagSuggestions: [],
                tagSuggestions: [],
            },
            lists: {
                initialLists: [],
                initialListSuggestions: [],
                showCollectionsPicker: false,
            },
            search: {
                showSearchBox: false,
                searchValue: '',
            },
            pausing: {
                isPaused: false,
            },
        }
    }

    init: EventHandler<'init'> = async ({ previousState }) => {
        await loadInitial<RibbonContainerState>(this, async () => {
            this.emitMutation({
                isRibbonEnabled: {
                    $set: await this.dependencies.getSidebarEnabled(),
                },
            })
        })
    }

    cleanup() {}

    toggleRibbon: EventHandler<'toggleRibbon'> = async ({ previousState }) => {
        const shouldBeEnabled = !previousState.isRibbonEnabled
        if (shouldBeEnabled) {
            this.emitMutation({ isRibbonEnabled: { $set: true } })
        }
        await this.dependencies.setSidebarEnabled(shouldBeEnabled)
        if (!shouldBeEnabled) {
            this.dependencies.inPageUI.removeRibbon()
        }
    }

    //
    // Bookmark
    //
    toggleBookmark: EventHandler<'toggleBookmark'> = async ({
        previousState,
    }) => {
        const shouldBeBookmarked = !previousState.bookmark.isBookmarked
        if (shouldBeBookmarked) {
            await this.dependencies.bookmarks.addPageBookmark({
                url: this.dependencies.currentTab.url,
                tabId: this.dependencies.currentTab.id,
            })
        } else {
            await this.dependencies.bookmarks.delPageBookmark({
                url: this.dependencies.currentTab.url,
            })
        }
        return { bookmark: { isBookmarked: { $set: shouldBeBookmarked } } }
    }

    //
    // Comment box
    //
    setShowCommentBox: EventHandler<'setShowCommentBox'> = ({ event }) => {
        return { commentBox: { showCommentBox: { $set: event.value } } }
    }

    handleCommentTextChange: EventHandler<'handleCommentTextChange'> = async ({
        event,
        previousState,
    }) => {
        return { commentBox: { commentText: { $set: event.value } } }
    }

    saveComment: EventHandler<'saveComment'> = async ({
        event,
        previousState,
    }) => {
        this.emitMutation({ commentBox: { showCommentBox: { $set: false } } })

        const save = async (options: { bookmark: boolean; tags: string[] }) => {
            const annotUrl = await this.dependencies.annotations.createAnnotation(
                {
                    url: this.dependencies.currentTab.url,
                    comment: previousState.commentBox.commentText,
                    bookmarked: options.bookmark,
                },
            )
            await this.dependencies.annotations.editAnnotationTags({
                url: annotUrl,
                tagsToBeAdded: previousState.commentBox.tags,
                tagsToBeDeleted: [],
            })
        }
        await save({
            bookmark: previousState.commentBox.isCommentBookmarked,
            tags: previousState.commentBox.tags,
        })

        this.emitMutation({
            commentBox: {
                $set: {
                    ...INITIAL_COMMENT_BOX_STATE,
                    isCommentSaved: true,
                },
            },
        })
        await new Promise((resolve) => setTimeout(resolve, 2000))
        this.emitMutation({ commentBox: { isCommentSaved: { $set: false } } })
    }

    cancelComment: EventHandler<'cancelComment'> = ({
        event,
        previousState,
    }) => {
        return { commentBox: { showCommentBox: { $set: false } } }
    }

    toggleCommentBookmark: EventHandler<'toggleCommentBookmark'> = ({
        event,
        previousState,
    }) => {
        return {
            commentBox: { isCommentBookmarked: { $apply: (prev) => !prev } },
        }
    }

    toggleTagPicker: EventHandler<'toggleTagPicker'> = ({
        event,
        previousState,
    }) => {
        return { commentBox: { showTagsPicker: { $apply: (prev) => !prev } } }
    }

    //
    // Tagging
    //
    setShowTagsPicker: EventHandler<'setShowTagsPicker'> = ({
        event,
        previousState,
    }) => {
        return { tagging: { showTagsPicker: { $set: event.value } } }
    }

    addTag: EventHandler<'addTag'> = async ({ event, previousState }) => {
        this.emitMutation({
            [event.value.context]: {
                tags: { $apply: (tags) => [...tags, event.value.tag] },
            },
        })
        if (event.value.context === 'tagging') {
            await this.dependencies.tags.addTagToPage({
                url: this.dependencies.currentTab.url,
                tag: event.value.tag,
            })
        }
    }

    deleteTag: EventHandler<'deleteTag'> = async ({ event, previousState }) => {
        const index = previousState[event.value.context].tags.indexOf(
            event.value.tag,
        )
        if (index === -1) {
            return
        }
        this.emitMutation({
            [event.value.context]: { tags: { $splice: [[index, 1]] } },
        })
        if (event.value.context === 'tagging') {
            await this.dependencies.tags.delTag({
                url: this.dependencies.currentTab.url,
                tag: event.value.tag,
            })
        }
    }

    //
    // Lists
    //
    onCollectionAdd: EventHandler<'onCollectionAdd'> = async ({ event }) => {
        await this.dependencies.customLists.insertPageToList({
            id: event.value.id,
            url: this.dependencies.currentTab.url,
        })
    }

    onCollectionDel: EventHandler<'onCollectionDel'> = async ({ event }) => {
        await this.dependencies.customLists.removePageFromList({
            id: event.value.id,
            url: this.dependencies.currentTab.url,
        })
    }

    setShowCollectionsPicker: EventHandler<
        'setShowCollectionsPicker'
    > = async ({ event }) => {
        return { lists: { showCollectionsPicker: { $set: event.value } } }
    }

    //
    // Search
    //
    setShowSearchBox: EventHandler<'setShowSearchBox'> = async ({ event }) => {
        return { search: { showSearchBox: { $set: event.value } } }
    }

    setSearchValue: EventHandler<'setSearchValue'> = async ({ event }) => {
        return { search: { searchValue: { $set: event.value } } }
    }

    //
    // Pausing
    //
    handlePauseToggle: EventHandler<'handlePauseToggle'> = async ({
        event,
        previousState,
    }) => {
        await this.dependencies.activityLogger.toggleLoggingPause()
        return { pausing: { isPaused: { $apply: (prev) => !prev } } }
    }
}
