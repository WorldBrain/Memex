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
    commentBox: ValuesOf<componentTypes.RibbonCommentBoxProps>
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

export const INITIAL_RIBBON_COMMENT_BOX_STATE = {
    commentText: '',
    showCommentBox: false,
    isCommentSaved: false,
    isCommentBookmarked: false,
    isTagInputActive: false,
    showTagsPicker: false,
    tags: [],
}
export class RibbonContainerLogic extends UILogic<
    RibbonContainerState,
    RibbonContainerEvents
> {
    commentSavedTimeout = 2000
    skipAnnotationPageIndexing = false

    constructor(private dependencies: RibbonContainerOptions) {
        super()
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
            commentBox: INITIAL_RIBBON_COMMENT_BOX_STATE,
            bookmark: {
                isBookmarked: false,
            },
            tagging: {
                tags: [],
                showTagsPicker: false,
            },
            lists: {
                showListsPicker: false,
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
                pausing: {
                    isPaused: {
                        $set: await this.dependencies.activityLogger.isLoggingPaused(),
                    },
                },
                bookmark: {
                    isBookmarked: {
                        $set: await this.dependencies.bookmarks.pageHasBookmark(
                            this.dependencies.currentTab.url,
                        ),
                    },
                },
                isRibbonEnabled: {
                    $set: await this.dependencies.getSidebarEnabled(),
                },
            })
        })
    }

    cleanup() {}

    toggleRibbon: EventHandler<'toggleRibbon'> = async ({ previousState }) => {
        const shouldBeEnabled = !previousState.isRibbonEnabled
        this.emitMutation({ isRibbonEnabled: { $set: shouldBeEnabled } })
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

    saveComment: EventHandler<'saveComment'> = async ({ previousState }) => {
        this.emitMutation({ commentBox: { showCommentBox: { $set: false } } })

        const save = async (options: { bookmark: boolean; tags: string[] }) => {
            const annotUrl = await this.dependencies.annotations.createAnnotation(
                {
                    url: this.dependencies.currentTab.url,
                    comment: previousState.commentBox.commentText,
                    bookmarked: options.bookmark,
                },
                { skipPageIndexing: this.skipAnnotationPageIndexing },
            )
            await this.dependencies.annotations.editAnnotationTags({
                url: annotUrl,
                tagsToBeAdded: options.tags,
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
                    ...INITIAL_RIBBON_COMMENT_BOX_STATE,
                    isCommentSaved: true,
                },
            },
        })
        await new Promise((resolve) =>
            setTimeout(resolve, this.commentSavedTimeout),
        )
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

    private _updateTags: (
        context: 'commentBox' | 'tagging',
    ) => EventHandler<'updateTags' | 'updateCommentTags'> = (
        context,
    ) => async ({ event }) => {
        const backendResult =
            context === 'commentBox'
                ? Promise.resolve()
                : this.dependencies.tags.updateTagForPage({
                      added: event.value.added,
                      deleted: event.value.deleted,
                      url: this.dependencies.currentTab.url,
                      tabId: this.dependencies.currentTab.id,
                  })

        let tagsStateUpdater: (tags: string[]) => string[]

        if (event.value.added) {
            tagsStateUpdater = (tags) => {
                const tag = event.value.added
                return tags.includes(tag) ? tags : [...tags, tag]
            }
        }

        if (event.value.deleted) {
            tagsStateUpdater = (tags) => {
                const index = tags.indexOf(event.value.deleted)
                if (index === -1) {
                    return tags
                }

                return [...tags.slice(0, index), ...tags.slice(index + 1)]
            }
        }
        this.emitMutation({
            [context]: { tags: { $apply: tagsStateUpdater } },
        })

        return backendResult
    }

    updateCommentTags = this._updateTags('commentBox')
    updateTags = this._updateTags('tagging')

    //
    // Lists
    //
    updateLists: EventHandler<'updateLists'> = async ({ event }) => {
        return this.dependencies.customLists.updateListForPage({
            added: event.value.added,
            deleted: event.value.deleted,
            url: this.dependencies.currentTab.url,
            tabId: this.dependencies.currentTab.id,
        })
    }

    setShowListsPicker: EventHandler<'setShowListsPicker'> = async ({
        event,
    }) => {
        return { lists: { showListsPicker: { $set: event.value } } }
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
