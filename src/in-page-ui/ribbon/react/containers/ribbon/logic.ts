import { UILogic, UIEvent, UIEventHandler, UIMutation } from 'ui-logic-core'
import { RibbonContainerDependencies } from './types'
import * as componentTypes from '../../components/types'
import { SharedInPageUIInterface } from 'src/in-page-ui/shared-state/types'
import { TaskState } from 'ui-logic-core/lib/types'
import { loadInitial } from 'src/util/ui-logic'
import {
    generateAnnotationUrl,
    shareOptsToPrivacyLvl,
} from 'src/annotations/utils'
import { resolvablePromise } from 'src/util/resolvable'
import { FocusableComponent } from 'src/annotations/components/types'
import { Analytics } from 'src/analytics'
import { createAnnotation } from 'src/annotations/annotation-save-logic'
import browser from 'webextension-polyfill'
import { Storage } from 'webextension-polyfill-ts'

export type PropKeys<Base, ValueCondition> = keyof Pick<
    Base,
    {
        [Key in keyof Base]: Base[Key] extends ValueCondition ? Key : never
    }[keyof Base]
>

// TODO: get rid of this stuff. I think it was added in an attempt to derive more from what already is there,
//   but ultimately it adds a lot more complexity around the types here, which doesn't exist on any other
//   UI logic class in the project. Makes it really difficult to alter the signatures of events here
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
    isWidthLocked: boolean | null
    areExtraButtonsShown: boolean
    areTutorialShown: boolean
    showFeed: boolean
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
        toggleShowTutorial: null
        toggleFeed: null
        toggleReadingView: null
        hydrateStateFromDB: { url: string }
    } & SubcomponentHandlers<'highlights'> &
        SubcomponentHandlers<'tooltip'> &
        // SubcomponentHandlers<'sidebar'> &
        Omit<SubcomponentHandlers<'commentBox'>, 'saveComment'> & {
            saveComment: {
                shouldShare: boolean
                isProtected?: boolean
            }
        } & SubcomponentHandlers<'bookmark'> &
        SubcomponentHandlers<'tagging'> &
        SubcomponentHandlers<'lists'> &
        SubcomponentHandlers<'search'> &
        SubcomponentHandlers<'pausing'>
>

export interface RibbonContainerOptions extends RibbonContainerDependencies {
    inPageUI: SharedInPageUIInterface
    setRibbonShouldAutoHide: (value: boolean) => void
}

export interface RibbonLogicOptions extends RibbonContainerOptions {
    focusCreateForm: FocusableComponent['focus']
    analytics: Analytics
}

type EventHandler<
    EventName extends keyof RibbonContainerEvents
> = UIEventHandler<RibbonContainerState, RibbonContainerEvents, EventName>

export const INITIAL_RIBBON_COMMENT_BOX_STATE = {
    commentText: '',
    showCommentBox: false,
    isCommentSaved: false,
    tags: [],
    lists: [],
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
    readingView = false

    constructor(private dependencies: RibbonLogicOptions) {
        super()
    }

    getInitialState(): RibbonContainerState {
        return {
            pageUrl: null,
            loadState: 'pristine',
            areExtraButtonsShown: false,
            areTutorialShown: false,
            showFeed: false,
            isWidthLocked: false,
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
                shouldShowTagsUIs: false,
            },
            lists: {
                showListsPicker: false,
                pageListIds: [],
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
        const { getPageUrl, syncSettings } = this.dependencies

        this.initReadingViewListeners()

        await loadInitial<RibbonContainerState>(this, async () => {
            const [url, areTagsMigrated] = await Promise.all([
                getPageUrl(),
                syncSettings.extension.get('areTagsMigratedToSpaces'),
            ])

            this.emitMutation({
                pageUrl: { $set: url },
                tagging: {
                    shouldShowTagsUIs: { $set: !areTagsMigrated },
                },
            })
            await this.hydrateStateFromDB({ ...incoming, event: { url } })
        })
        this.initLogicResolvable.resolve()
    }

    async initReadingViewListeners() {
        // make sure to reset readingviewValue on sidebar open on new page
        await browser.storage.local.set({ '@Sidebar-reading_view': false })

        // init listeners to local storage flag for reading view
        await browser.storage.onChanged.addListener((changes) => {
            this.setReadingView(changes)
        })
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
                    $set: await true,
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
            lists: { pageListIds: { $set: lists } },
        })
    }

    cleanup() {}

    toggleReadingView: EventHandler<'toggleReadingView'> = async ({
        previousState,
    }) => {
        // init dom elements and observers
        let sidebar = document
            .getElementById('memex-sidebar-container')
            .shadowRoot.getElementById('annotationSidebarContainer')

        if (sidebar == null) {
            return
        }

        const resizeObserver = new ResizeObserver(this.resizeReadingWidth)

        if (previousState.isWidthLocked) {
            // set member variable for internal logic use
            this.readingView = false

            // set mutation for UI changes
            this.emitMutation({
                isWidthLocked: { $set: false },
            })

            // reset window width
            document.body.style.width = 'initial'

            // IS NOT WORKING
            resizeObserver.unobserve(sidebar)

            // remove listeners and values
            this.tearDownListeners(resizeObserver, sidebar)
            await browser.storage.local.set({ '@Sidebar-reading_view': false })
        } else {
            // set member variable for internal logic use
            this.readingView = true

            // set mutation for UI changes
            this.emitMutation({
                isWidthLocked: { $set: true },
            })

            // force resize calc
            this.resizeReadingWidth()

            // init window resize event listener
            window.addEventListener('resize', this.resizeReadingWidth)

            // observe size changes of sidebar and adjust reading view
            resizeObserver.observe(sidebar)

            // set corret storage values
            await browser.storage.local.set({ '@Sidebar-reading_view': true })
        }
    }

    setReadingView = (changes: Storage.StorageChange) => {
        if (Object.entries(changes)[0][0] === '@Sidebar-reading_view') {
            this.emitMutation({
                isWidthLocked: { $set: Object.entries(changes)[0][1].newValue },
            })
            this.readingView = Object.entries(changes)[0][1].newValue
        }
    }

    tearDownListeners(resizeObserver?, sidebar?) {
        window.removeEventListener('resize', this.resizeReadingWidth)
        browser.storage.onChanged.removeListener((changes) => {
            this.setReadingView(changes)
        })
    }

    resizeReadingWidth = () => {
        // this is here because the unobserve of the sidebar resize action is not working
        if (this.readingView === true) {
            let currentsidebarWidth = document
                .getElementById('memex-sidebar-container')
                .shadowRoot.getElementById('annotationSidebarContainer')
                .offsetWidth
            let currentWindowWidth = window.innerWidth
            let readingWidth =
                currentWindowWidth - currentsidebarWidth - 10 + 'px'
            document.body.style.width = readingWidth
        }
    }

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

    toggleFeed: EventHandler<'toggleFeed'> = ({ previousState }) => {
        this.dependencies.setRibbonShouldAutoHide(previousState.showFeed)
        const mutation: UIMutation<RibbonContainerState> = {
            showFeed: { $set: !previousState.showFeed },
            areExtraButtonsShown: { $set: false },
            areTutorialShown: { $set: false },
        }

        if (!previousState.showFeed) {
            mutation.commentBox = { showCommentBox: { $set: false } }
            mutation.tagging = { showTagsPicker: { $set: false } }
            mutation.lists = { showListsPicker: { $set: false } }
        }

        this.emitMutation(mutation)
    }

    toggleShowExtraButtons: EventHandler<'toggleShowExtraButtons'> = ({
        previousState,
    }) => {
        this.dependencies.setRibbonShouldAutoHide(
            previousState.areExtraButtonsShown,
        )
        const mutation: UIMutation<RibbonContainerState> = {
            areExtraButtonsShown: { $set: !previousState.areExtraButtonsShown },
            areTutorialShown: { $set: false },
            showFeed: { $set: false },
        }

        if (!previousState.areExtraButtonsShown) {
            mutation.commentBox = { showCommentBox: { $set: false } }
            mutation.tagging = { showTagsPicker: { $set: false } }
            mutation.lists = { showListsPicker: { $set: false } }
        }

        this.emitMutation(mutation)
    }

    toggleShowTutorial: EventHandler<'toggleShowTutorial'> = ({
        previousState,
    }) => {
        this.dependencies.setRibbonShouldAutoHide(
            previousState.areTutorialShown,
        )
        const mutation: UIMutation<RibbonContainerState> = {
            areTutorialShown: { $set: !previousState.areTutorialShown },
            areExtraButtonsShown: { $set: false },
            showFeed: { $set: false },
        }

        if (!previousState.areTutorialShown) {
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
                bookmark: { isBookmarked: { $set: isBookmarked } },
            })

        const shouldBeBookmarked = !postInitState.bookmark.isBookmarked

        try {
            if (shouldBeBookmarked) {
                updateState(shouldBeBookmarked)
                await this.dependencies.bookmarks.addPageBookmark({
                    fullUrl: postInitState.pageUrl,
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
                      areTutorialShown: { $set: false },
                      showFeed: { $set: false },
                  }
                : {}

        this.emitMutation({
            commentBox: { showCommentBox: { $set: event.value } },
            ...extra,
        })

        if (event.value) {
            this.dependencies.focusCreateForm()
        }
    }

    saveComment: EventHandler<'saveComment'> = async ({
        event: { shouldShare, isProtected },
        previousState: { pageUrl, commentBox },
    }) => {
        const comment = commentBox.commentText.trim()
        if (comment.length === 0) {
            return
        }

        this.emitMutation({ commentBox: { showCommentBox: { $set: false } } })

        const localAnnotationId = generateAnnotationUrl({
            pageUrl,
            now: () => Date.now(),
        })

        this.emitMutation({
            commentBox: {
                $set: {
                    ...INITIAL_RIBBON_COMMENT_BOX_STATE,
                    isCommentSaved: true,
                },
            },
        })
        const now = Date.now()

        const { remoteAnnotationId, savePromise } = await createAnnotation({
            annotationsBG: this.dependencies.annotations,
            contentSharingBG: this.dependencies.contentSharing,
            annotationData: {
                comment,
                fullPageUrl: pageUrl,
                localId: localAnnotationId,
                createdWhen: new Date(now),
            },
        })
        this.dependencies.annotationsCache.addAnnotation({
            localId: localAnnotationId,
            remoteId: remoteAnnotationId ?? undefined,
            comment,
            normalizedPageUrl: pageUrl,
            unifiedListIds: [],
            lastEdited: now,
            createdWhen: now,
            localListIds: commentBox.lists,
            creator: this.dependencies.currentUser,
            privacyLevel: shareOptsToPrivacyLvl({
                shouldShare,
                isBulkShareProtected: isProtected,
            }),
        })
        this.dependencies.setRibbonShouldAutoHide(true)

        await Promise.all([
            new Promise((resolve) =>
                setTimeout(resolve, this.commentSavedTimeout),
            ),
            savePromise,
        ])
        this.emitMutation({ commentBox: { isCommentSaved: { $set: false } } })
    }

    cancelComment: EventHandler<'cancelComment'> = () => {
        this.dependencies.setRibbonShouldAutoHide(true)

        this.emitMutation({
            commentBox: { $set: INITIAL_RIBBON_COMMENT_BOX_STATE },
        })
    }

    changeComment: EventHandler<'changeComment'> = ({ event }) => {
        this.emitMutation({
            commentBox: { commentText: { $set: event.value } },
        })
    }

    updateCommentBoxTags: EventHandler<'updateCommentBoxTags'> = ({
        event,
    }) => {
        this.emitMutation({ commentBox: { tags: { $set: event.value } } })
    }

    updateCommentBoxLists: EventHandler<'updateCommentBoxLists'> = ({
        event,
    }) => {
        this.emitMutation({ commentBox: { lists: { $set: event.value } } })
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
                      areTutorialShown: { $set: false },
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
        if (context === 'tagging' && event.value.added != null) {
            this.dependencies.analytics.trackEvent({
                category: 'Tags',
                action: 'createForPageViaRibbon',
            })
        }

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
        const pageListsSet = new Set(previousState.lists.pageListIds)
        if (event.value.added != null) {
            pageListsSet.add(event.value.added)
        } else {
            pageListsSet.delete(event.value.deleted)
        }
        this.emitMutation({
            lists: { pageListIds: { $set: [...pageListsSet] } },
        })

        // TODO: cache implement
        // await this.dependencies.annotationsCache.updatePublicAnnotationLists({
        //     added: event.value.added,
        //     deleted: event.value.deleted,
        // })
        return this.dependencies.customLists.updateListForPage({
            added: event.value.added,
            deleted: event.value.deleted,
            url: previousState.pageUrl,
            tabId: this.dependencies.currentTab.id,
            skipPageIndexing: event.value.skipPageIndexing,
        })
    }

    listAllTabs: EventHandler<'listAllTabs'> = ({ event }) => {
        return this.dependencies.customLists.addOpenTabsToList({
            listId: event.value,
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
                      areTutorialShown: { $set: false },
                      showFeed: { $set: false },
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
                      areTutorialShown: { $set: false },
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
            // await this.dependencies.activityLogger.toggleLoggingPause()
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
