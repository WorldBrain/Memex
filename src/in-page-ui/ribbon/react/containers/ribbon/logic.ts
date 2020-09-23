import { UILogic, UIEvent, UIEventHandler, UIMutation } from 'ui-logic-core'
import { RibbonContainerDependencies } from './types'
import * as componentTypes from '../../components/types'
import { SharedInPageUIInterface } from 'src/in-page-ui/shared-state/types'
import { TaskState } from 'ui-logic-core/lib/types'
import { loadInitial } from 'src/util/ui-logic'
import { NewAnnotationOptions } from 'src/annotations/types'
import { generateUrl } from 'src/annotations/utils'
import { resolvablePromise } from 'src/util/resolvable'

export type PropKeys<Base, ValueCondition> = keyof Pick<
    Base,
    {
        [Key in keyof Base]: Base[Key] extends ValueCondition ? Key : never
    }[keyof Base]
>
type ValuesOf<Props> = Omit<Props, PropKeys<Props, Function>> // tslint:disable-line
type HandlersOf<Props> = {
    // tslint:disable-next-line
    [Key in PropKeys<Props, Function>]: Props[Key] extends (
        value: infer Arg,
    ) => void
        ? { value: Arg }
        : null
}
type SubcomponentHandlers<
    Subcomponent extends keyof componentTypes.RibbonSubcomponentProps
> = HandlersOf<componentTypes.RibbonSubcomponentProps[Subcomponent]>

export interface RibbonContainerState {
    pageUrl: string
    loadState: TaskState
    isRibbonEnabled: boolean | null
    areExtraButtonsShown: boolean

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
        highlightAnnotations: null
        toggleShowExtraButtons: null
        hydrateStateFromDB: { url: string }
        saveNewPageComment: (annotation: NewAnnotationOptions) => void
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
    inPageUI: SharedInPageUIInterface
    setRibbonShouldAutoHide: (value: boolean) => void
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
    /**
     * This resolves once the `init` method logic resolves. Useful for stopping race-conditions
     * between ribbon loading and other state mutation events, particularly those that are triggered
     * by keyboard shortcuts - can happen before the ribbon is first loaded.
     */
    private initLogicResolvable = resolvablePromise()

    commentSavedTimeout = 2000

    constructor(private dependencies: RibbonContainerOptions) {
        super()
    }

    getInitialState(): RibbonContainerState {
        return {
            pageUrl: this.dependencies.currentTab.url,
            loadState: 'pristine',
            areExtraButtonsShown: false,
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
                pageHasTags: false,
            },
            lists: {
                showListsPicker: false,
                pageBelongsToList: false,
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

    init: EventHandler<'init'> = async (incoming) => {
        await loadInitial<RibbonContainerState>(this, async () => {
            const { url } = this.dependencies.currentTab
            await this.hydrateStateFromDB({ ...incoming, event: { url } })
        })
        this.initLogicResolvable.resolve()
    }

    hydrateStateFromDB: EventHandler<'hydrateStateFromDB'> = async ({
        event: { url },
    }) => {
        const tags = await this.dependencies.tags.fetchPageTags({ url })
        const lists = await this.dependencies.customLists.fetchPageLists({
            url,
        })

        this.emitMutation({
            pageUrl: { $set: url },
            pausing: {
                isPaused: {
                    $set: await this.dependencies.activityLogger.isLoggingPaused(),
                },
            },
            bookmark: {
                isBookmarked: {
                    $set: await this.dependencies.bookmarks.pageHasBookmark(
                        url,
                    ),
                },
            },
            isRibbonEnabled: {
                $set: await this.dependencies.getSidebarEnabled(),
            },
            tooltip: {
                isTooltipEnabled: {
                    $set: await this.dependencies.tooltip.getState(),
                },
            },
            highlights: {
                areHighlightsEnabled: {
                    $set: await this.dependencies.highlights.getState(),
                },
            },
            tagging: {
                pageHasTags: {
                    $set: tags.length > 0,
                },
            },
            lists: {
                pageBelongsToList: {
                    $set: lists.length > 0,
                },
            },
        })
    }

    cleanup() {}

    /**
     * This exists due to a race-condition between bookmark shortcut and init hydration logic.
     * Having this ensures any event handler can wait until the init logic is taken care and also
     * receive any state changes that happen during that wait.
     */
    private async waitForPostInitState(
        initState: RibbonContainerState,
    ): Promise<RibbonContainerState> {
        let latestState = { ...initState }

        const stateUpdater = (mutation: UIMutation<RibbonContainerState>) => {
            latestState = this.withMutation(latestState, mutation)
        }

        this.events.on('mutation', stateUpdater)
        await this.initLogicResolvable
        this.events.removeListener('mutation', stateUpdater)

        return latestState
    }

    toggleShowExtraButtons: EventHandler<'toggleShowExtraButtons'> = ({
        previousState,
    }) => {
        const mutation: UIMutation<RibbonContainerState> = {
            areExtraButtonsShown: { $set: !previousState.areExtraButtonsShown },
        }

        if (!previousState.areExtraButtonsShown) {
            mutation.commentBox = { showCommentBox: { $set: false } }
            mutation.tagging = { showTagsPicker: { $set: false } }
            mutation.lists = { showListsPicker: { $set: false } }
        }

        this.emitMutation(mutation)
    }

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
        const postInitState = await this.waitForPostInitState(previousState)

        const updateState = (isBookmarked) =>
            this.emitMutation({
                bookmark: { isBookmarked: { $set: true } },
            })

        const shouldBeBookmarked = true
        updateState(shouldBeBookmarked)

        try {
            if (shouldBeBookmarked) {
                await this.dependencies.bookmarks.addPageBookmark({
                    url: postInitState.pageUrl,
                    tabId: this.dependencies.currentTab.id,
                })
            }
        } catch (err) {
            updateState(!shouldBeBookmarked)
            throw err
        }
    }

    //
    // Comment box
    //
    setShowCommentBox: EventHandler<'setShowCommentBox'> = async ({
        event,
    }) => {
        await this.initLogicResolvable
        this.dependencies.setRibbonShouldAutoHide(!event.value)
        const extra: UIMutation<RibbonContainerState> =
            event.value === true
                ? {
                      tagging: { showTagsPicker: { $set: false } },
                      lists: { showListsPicker: { $set: false } },
                      search: { showSearchBox: { $set: false } },
                      areExtraButtonsShown: { $set: false },
                  }
                : {}

        return {
            commentBox: { showCommentBox: { $set: event.value } },
            ...extra,
        }
    }

    saveComment: EventHandler<'saveComment'> = async ({
        previousState,
        event,
    }) => {
        const { annotationsCache } = this.dependencies
        const comment = event.value.text.trim()
        const { isBookmarked, tags } = event.value
        if (comment.length === 0) {
            return
        }

        this.emitMutation({ commentBox: { showCommentBox: { $set: false } } })

        const annotationUrl = generateUrl({
            pageUrl: previousState.pageUrl,
            now: () => Date.now(),
        })

        await annotationsCache.create({
            url: annotationUrl,
            pageUrl: previousState.pageUrl,
            comment,
            isBookmarked,
            tags,
        })

        this.emitMutation({
            commentBox: {
                $set: {
                    ...INITIAL_RIBBON_COMMENT_BOX_STATE,
                    isCommentSaved: true,
                },
            },
        })
        this.dependencies.setRibbonShouldAutoHide(true)

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

    //
    // Tagging
    //
    setShowTagsPicker: EventHandler<'setShowTagsPicker'> = async ({
        event,
    }) => {
        await this.initLogicResolvable
        this.dependencies.setRibbonShouldAutoHide(!event.value)
        const extra: UIMutation<RibbonContainerState> =
            event.value === true
                ? {
                      commentBox: { showCommentBox: { $set: false } },
                      lists: { showListsPicker: { $set: false } },
                      search: { showSearchBox: { $set: false } },
                      areExtraButtonsShown: { $set: false },
                  }
                : {}

        return {
            tagging: { showTagsPicker: { $set: event.value } },
            ...extra,
        }
    }

    private _updateTags: (
        context: 'commentBox' | 'tagging',
    ) => EventHandler<'updateTags'> = (context) => async ({
        previousState,
        event,
    }) => {
        const backendResult =
            context === 'commentBox'
                ? Promise.resolve()
                : this.dependencies.tags.updateTagForPage({
                      added: event.value.added,
                      deleted: event.value.deleted,
                      url: previousState.pageUrl,
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

    tagAllTabs: EventHandler<'tagAllTabs'> = ({ event }) => {
        return this.dependencies.tags.addTagsToOpenTabs({
            name: event.value,
        })
    }

    //
    // Lists
    //
    updateLists: EventHandler<'updateLists'> = async ({
        previousState,
        event,
    }) => {
        return this.dependencies.customLists.updateListForPage({
            added: event.value.added,
            deleted: event.value.deleted,
            url: previousState.pageUrl,
            tabId: this.dependencies.currentTab.id,
        })
    }

    listAllTabs: EventHandler<'listAllTabs'> = ({ event }) => {
        return this.dependencies.customLists.addOpenTabsToList({
            name: event.value,
        })
    }

    setShowListsPicker: EventHandler<'setShowListsPicker'> = async ({
        event,
    }) => {
        await this.initLogicResolvable
        this.dependencies.setRibbonShouldAutoHide(!event.value)
        const extra: UIMutation<RibbonContainerState> =
            event.value === true
                ? {
                      commentBox: { showCommentBox: { $set: false } },
                      tagging: { showTagsPicker: { $set: false } },
                      search: { showSearchBox: { $set: false } },
                      areExtraButtonsShown: { $set: false },
                  }
                : {}

        return { lists: { showListsPicker: { $set: event.value } }, ...extra }
    }
    //
    // Search
    //
    setShowSearchBox: EventHandler<'setShowSearchBox'> = ({ event }) => {
        this.dependencies.setRibbonShouldAutoHide(!event.value)
        const extra: UIMutation<RibbonContainerState> =
            event.value === true
                ? {
                      commentBox: { showCommentBox: { $set: false } },
                      tagging: { showTagsPicker: { $set: false } },
                      lists: { showListsPicker: { $set: false } },
                      areExtraButtonsShown: { $set: false },
                  }
                : {}

        return { search: { showSearchBox: { $set: event.value } }, ...extra }
    }

    setSearchValue: EventHandler<'setSearchValue'> = ({ event }) => {
        return { search: { searchValue: { $set: event.value } } }
    }

    //
    // Pausing
    //
    handlePauseToggle: EventHandler<'handlePauseToggle'> = async ({
        event,
        previousState,
    }) => {
        const toggleState = () =>
            this.emitMutation({
                pausing: { isPaused: { $apply: (prev) => !prev } },
            })

        toggleState()

        try {
            await this.dependencies.activityLogger.toggleLoggingPause()
        } catch (err) {
            toggleState()
            throw err
        }
    }

    //
    // Tooltip
    //
    handleTooltipToggle: EventHandler<'handleTooltipToggle'> = async ({}) => {
        const currentSetting = await this.dependencies.tooltip.getState()
        const setState = (state: boolean) =>
            this.emitMutation({
                tooltip: { isTooltipEnabled: { $set: state } },
            })

        setState(!currentSetting)

        try {
            if (currentSetting === true) {
                await this.dependencies.inPageUI.removeTooltip()
            } else {
                await this.dependencies.inPageUI.showTooltip()
            }
            await this.dependencies.tooltip.setState(!currentSetting)
        } catch (err) {
            setState(!currentSetting)
            throw err
        }
    }

    handleHighlightsToggle: EventHandler<'handleHighlightsToggle'> = async ({
        previousState,
    }) => {
        const currentSetting = await this.dependencies.highlights.getState()
        const setState = (state: boolean) => {
            this.emitMutation({
                highlights: { areHighlightsEnabled: { $set: state } },
            })
        }

        setState(!currentSetting)

        try {
            if (previousState.highlights.areHighlightsEnabled) {
                await this.dependencies.inPageUI.hideHighlights()
            } else {
                await this.dependencies.inPageUI.showHighlights()
            }

            await this.dependencies.highlights.setState(!currentSetting)
        } catch (err) {
            setState(!currentSetting)
            throw err
        }
    }
}
