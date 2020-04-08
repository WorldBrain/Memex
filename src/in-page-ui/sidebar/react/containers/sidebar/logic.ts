import {
    UILogic,
    UIEvent,
    UIEventHandlers,
    IncomingUIEvent,
    UIMutation,
    UIEventHandler,
} from 'ui-logic-core'
import { uiLoad } from 'ui-logic-core/lib/patterns'
import { TaskState } from 'ui-logic-core/lib/types'
import { SidebarControllerEventEmitter } from '../../../types'
import { SidebarEnv, Page } from '../../types'
import { Annotation, AnnotationsManagerInterface } from 'src/annotations/types'
import { Result, ResultsByUrl } from 'src/overview/types'
import { PageUrlsByDay } from 'src/search/background/types'
import { Anchor } from 'src/highlighting/types'

export interface SidebarContainerState {
    state: 'visible' | 'hidden'
    loadState: TaskState
    needsWaypoint: boolean
    appendLoader: boolean

    annotations: Annotation[]
    annotationModes: { [annotationUrl: string]: 'default' | 'edit' | 'delete' }

    showCommentBox: boolean
    commentBox: {
        anchor: Anchor
        form: {
            isCommentBookmarked: boolean
            isTagInputActive: boolean
            showTagsPicker: boolean
            tagSuggestions: string[]
            commentText: string
            isAnnotation: boolean
            tags: string[]
            initTagSuggestions: string[]
        }
    }

    // Everything below here is temporary

    activeAnnotationUrl: string
    hoverAnnotationUrl: string
    searchValue: string
    showCongratsMessage: boolean
    showClearFiltersBtn: boolean
    isSocialPost: boolean
    page: Page
    pageType: 'page' | 'all'
    searchType: 'notes' | 'page' | 'social'

    // Filter sidebar props
    showFiltersSidebar: boolean
    showSocialSearch: boolean
    annotsFolded: boolean
    resultsSearchType: 'page' | 'notes' | 'social'
    pageCount?: number
    annotCount?: number

    // Search result props
    noResults: boolean
    isBadTerm: boolean
    areAnnotationsExpanded: boolean
    shouldShowCount: boolean
    isInvalidSearch: boolean
    totalResultCount: number

    isNewSearchLoading: boolean
    isListFilterActive: boolean
    searchResults: Result[]
    resultsByUrl: ResultsByUrl
    resultsClusteredByDay: boolean
    annotsByDay: PageUrlsByDay
    isSocialSearch: boolean
    tagSuggestions: string[]
}

export type SidebarContainerEvents = UIEvent<{
    show: null
    hide: null

    // Adding a new page comment
    addNewPageComment: null
    changePageCommentText: { comment: string }
    saveNewPageComment: {
        anchor: Anchor
        commentText: string
        tags: string[]
        bookmarked: boolean
    }
    cancelNewPageComment: null
    toggleNewPageCommentBookmark: null
    togglePageCommentTags: null
    toggleNewPageCommentTagPicker: null
    addNewPageCommentTag: { tag: string }
    deleteNewPageCommentTag: { tag: string }
    // closeComments: null,

    // Annotation boxes
    goToAnnotation: { annnotation: Annotation }
    editAnnotation: { annnotationUrl: string }
    deleteAnnotation: { annnotationUrl: string }
    toggleAnnotationBookmark: { annnotationUrl: string }
    handleAnnotationModeSwitch: {
        annotationUrl: string
        mode: 'default' | 'edit' | 'delete'
    }

    // Search
    changeSearchQuery: { searchQuery: string }
    togglePageType: null
    setPageType: { type: 'page' | 'all' }
    setSearchType: { type: 'notes' | 'page' | 'social' }
    setResultsSearchType: { type: 'notes' | 'page' | 'social' }
    setAnnotationsExpanded: { value: boolean }
    clearAllFilters: null
    fetchSuggestedTags: null
    fetchSuggestedDomains: null
    resetFiterPopups: null
    toggleShowFilters: null
}>

export interface SidebarContainerDependencies {
    sidebarEvents: SidebarControllerEventEmitter
    env: SidebarEnv
    annotationManager: AnnotationsManagerInterface
    currentTab: { id: number; url: string }
    loadAnnotatons(url: string): Promise<Annotation[]>
    loadTagSuggestions: () => Promise<string[]>
}

type Incoming<EventName extends keyof SidebarContainerEvents> = IncomingUIEvent<
    SidebarContainerState,
    SidebarContainerEvents,
    EventName
>
type EventHandler<
    EventName extends keyof SidebarContainerEvents
> = UIEventHandler<SidebarContainerState, SidebarContainerEvents, EventName>

const INITIAL_COMMENT_BOX_STATE: SidebarContainerState['commentBox'] = {
    anchor: null,
    form: {
        isCommentBookmarked: false,
        isTagInputActive: false,
        showTagsPicker: false,
        tagSuggestions: [],
        commentText: '',
        isAnnotation: false,
        tags: [],
        initTagSuggestions: [],
    },
}

export class SidebarContainerLogic extends UILogic<
    SidebarContainerState,
    SidebarContainerEvents
>
// implements UIEventHandlers<SidebarContainerState, SidebarContainerEvents>
{
    constructor(private dependencies: SidebarContainerDependencies) {
        super()
    }

    getInitialState(): SidebarContainerState {
        return {
            state: 'visible',
            loadState: 'pristine',
            annotationModes: {},

            commentBox: { ...INITIAL_COMMENT_BOX_STATE },

            pageType: 'page',
            searchType: 'notes',
            isSocialPost: false,
            needsWaypoint: false,
            appendLoader: false,
            annotations: [],
            activeAnnotationUrl: '',
            hoverAnnotationUrl: '',
            showCommentBox: false,
            searchValue: '',
            showCongratsMessage: false,
            showClearFiltersBtn: false,
            page: {} as any,
            showFiltersSidebar: false,
            showSocialSearch: false,
            annotsFolded: false,
            resultsSearchType: 'page',
            pageCount: 0,
            annotCount: 0,
            noResults: false,
            isBadTerm: false,
            areAnnotationsExpanded: false,
            shouldShowCount: false,
            isInvalidSearch: false,
            totalResultCount: 0,
            isNewSearchLoading: false,
            isListFilterActive: false,
            searchResults: [],
            resultsByUrl: new Map(),
            resultsClusteredByDay: false,
            annotsByDay: {},
            isSocialSearch: false,
            tagSuggestions: [],
        }
    }

    async init() {
        await uiLoad<SidebarContainerState>(this, async () => {
            console.log('loading')
            const loadAnnotations = this.dependencies.loadAnnotatons(
                this.dependencies.currentTab.url,
            )
            const [annotations] = await Promise.all([loadAnnotations])
            this.emitMutation({ annotations: { $set: annotations } })
            console.log('loading complete')
        })
    }

    cleanup() {}

    show: EventHandler<'show'> = () => {
        return { state: { $set: 'visible' } }
    }

    hide: EventHandler<'hide'> = () => {
        return { state: { $set: 'hidden' } }
    }

    addNewPageComment: EventHandler<'addNewPageComment'> = async () => {
        this.emitMutation({ showCommentBox: { $set: true } })
        const suggestions = await this.dependencies.loadTagSuggestions()
        this.emitMutation({
            commentBox: { form: { tagSuggestions: { $set: suggestions } } },
        })
    }

    changePageCommentText: EventHandler<'changePageCommentText'> = incoming => {
        return {
            commentBox: {
                form: { commentText: { $set: incoming.event.comment } },
            },
        }
    }

    saveNewPageComment: EventHandler<'changePageCommentText'> = () => {
        this.emitMutation({
            commentBox: { form: { showTagsPicker: { $set: false } } },
        })
        this.emitMutation({
            commentBox: { $set: INITIAL_COMMENT_BOX_STATE },
            showCommentBox: { $set: false },
        })
    }

    cancelNewPageComment: EventHandler<'cancelNewPageComment'> = () => {
        // TODO: this.props.highlighter.removeTempHighlights()
        return {
            commentBox: { $set: INITIAL_COMMENT_BOX_STATE },
            showCommentBox: { $set: false },
        }
    }

    toggleNewPageCommentBookmark: EventHandler<
        'toggleNewPageCommentBookmark'
    > = () => {
        return {
            commentBox: {
                form: {
                    isCommentBookmarked: { $apply: bookmarked => !bookmarked },
                },
            },
        }
    }

    toggleNewPageCommentTagPicker: EventHandler<
        'toggleNewPageCommentTagPicker'
    > = () => {
        return {
            commentBox: {
                form: { showTagsPicker: { $apply: active => !active } },
            },
        }
    }

    addNewPageCommentTag: EventHandler<'addNewPageCommentTag'> = incoming => {
        return {
            commentBox: {
                form: {
                    tags: {
                        $apply: (tags: string[]) => {
                            const tag = incoming.event.tag
                            return tags.includes(tag) ? tags : [...tags, tag]
                        },
                    },
                },
            },
        }
    }

    deleteNewPageCommentTag: EventHandler<
        'deleteNewPageCommentTag'
    > = incoming => {
        return {
            commentBox: {
                form: {
                    tags: {
                        $apply: (tags: string[]) => {
                            const tag = incoming.event.tag
                            const tagIndex = tags.indexOf(tag)
                            if (tagIndex === -1) {
                                return tags
                            }

                            tags = [...tags]
                            tags.splice(tagIndex, 1)
                            return tags
                        },
                    },
                },
            },
        }
    }

    goToAnnotation: EventHandler<'goToAnnotation'> = incoming => {}

    editAnnotation: EventHandler<'editAnnotation'> = incoming => {
        return {
            annotationModes: {
                [incoming.event.annnotationUrl]: { $set: 'default' },
            },
        }
    }

    deleteAnnotation: EventHandler<'deleteAnnotation'> = incoming => {
        // console.log('delete annm')
        return {
            annotationModes: {
                [incoming.event.annnotationUrl]: { $set: 'default' },
            },
        }
    }

    toggleAnnotationBookmark: EventHandler<
        'toggleAnnotationBookmark'
    > = incoming => {
        const annotationIndex = incoming.previousState.annotations.findIndex(
            annotation => (annotation.url = incoming.event.annnotationUrl),
        )
        const currentlyBookmarked =
            incoming.previousState.annotations[annotationIndex].hasBookmark
        const shouldBeBookmarked = !currentlyBookmarked
        console.log({
            annotations: {
                [annotationIndex]: {
                    hasBookmark: { $set: shouldBeBookmarked },
                },
            },
        })
        this.emitMutation({
            annotations: {
                [annotationIndex]: {
                    hasBookmark: { $set: shouldBeBookmarked },
                },
            },
        })
        if (shouldBeBookmarked) {
        } else {
        }
    }

    handleAnnotationModeSwitch: EventHandler<
        'handleAnnotationModeSwitch'
    > = incoming => {
        return {
            annotationModes: {
                [incoming.event.annotationUrl]: { $set: incoming.event.mode },
            },
        }
    }

    changeSearchQuery: EventHandler<'changeSearchQuery'> = incoming => {
        return {
            searchValue: { $set: incoming.event.searchQuery },
        }
    }

    togglePageType: EventHandler<'togglePageType'> = incoming => {
        return {
            pageType: {
                $apply: pageType => (pageType === 'all' ? 'page' : 'all'),
            },
        }
    }

    setPageType: EventHandler<'setPageType'> = incoming => {
        return {
            pageType: { $set: incoming.event.type },
        }
    }

    setSearchType: EventHandler<'setSearchType'> = incoming => {
        return {
            searchType: { $set: incoming.event.type },
        }
    }

    setResultsSearchType: EventHandler<'setResultsSearchType'> = incoming => {
        return {
            resultsSearchType: { $set: incoming.event.type },
        }
    }

    setAnnotationsExpanded: EventHandler<
        'setAnnotationsExpanded'
    > = incoming => {}

    clearAllFilters: EventHandler<'clearAllFilters'> = incoming => {}

    fetchSuggestedTags: EventHandler<'fetchSuggestedTags'> = incoming => {}

    fetchSuggestedDomains: EventHandler<
        'fetchSuggestedDomains'
    > = incoming => {}

    resetFiterPopups: EventHandler<'resetFiterPopups'> = incoming => {}

    toggleShowFilters: EventHandler<'toggleShowFilters'> = incoming => {
        return { showFiltersSidebar: { $apply: show => !show } }
    }
}
