import * as React from 'react'
import {
    SidebarContainerOptions,
    SidebarContainerState,
    SidebarContainerLogic,
    SidebarContainerEvents,
} from './logic'
import { StatefulUIElement } from 'src/util/ui-logic'
import Sidebar from '../../components/sidebar'
import { Anchor } from 'src/highlighting/types'
import {
    InPageUIEvents,
    InPageUISidebarAction,
} from 'src/in-page-ui/shared-state/types'

export interface SidebarContainerProps extends SidebarContainerOptions {}

export default class SidebarContainer extends StatefulUIElement<
    SidebarContainerProps,
    SidebarContainerState,
    SidebarContainerEvents
> {
    constructor(props) {
        super(props, new SidebarContainerLogic(props))
    }

    componentDidMount() {
        super.componentDidMount()
        this.props.inPageUI.events.on(
            'stateChanged',
            this.handleInPageUIStateChange,
        )
        this.props.inPageUI.events.on(
            'sidebarAction',
            this.handleExternalAction,
        )
    }

    componentWillUnmount() {
        super.componentWillUnmount()
        this.props.inPageUI.events.removeListener(
            'stateChanged',
            this.handleInPageUIStateChange,
        )
        this.props.inPageUI.events.removeListener(
            'sidebarAction',
            this.handleExternalAction,
        )
    }

    handleInPageUIStateChange: InPageUIEvents['stateChanged'] = ({
        changes,
    }) => {
        if ('sidebar' in changes) {
            if (changes.sidebar) {
                this.showSidebar()
            } else {
                this.hideSidebar()
            }
        }
    }

    showSidebar = () => {
        this.processEvent('show', null)
    }

    hideSidebar = () => {
        this.processEvent('hide', null)
    }

    handleExternalAction = (event: {
        action: InPageUISidebarAction
        anchor?: Anchor
    }) => {
        if (event.action === 'annotate' || event.action === 'comment') {
            this.processEvent('addNewPageComment', null)
            if (event.anchor) {
                this.processEvent('setNewPageCommentAnchor', {
                    anchor: event.anchor,
                })
            }
        }
        this.forceUpdate()
    }

    render() {
        const createAnnotationEventHandlers = (
            context: 'pageAnnotations' | 'searchResults',
        ) => {
            return {
                handleAnnotationTagClick: (annotationUrl, tag) => {},
                handleAnnotationModeSwitch: (annotationUrl, mode) =>
                    this.processEvent('switchAnnotationMode', {
                        context,
                        annotationUrl,
                        mode,
                    }),
                handleGoToAnnotation: (annnotationUrl) =>
                    this.processEvent('goToAnnotation', {
                        context,
                        annnotationUrl,
                    }),
                handleMouseEnter: (annnotationUrl) =>
                    this.processEvent('annotationMouseEnter', {
                        context,
                        annnotationUrl,
                    }),
                handleMouseLeave: (annnotationUrl) =>
                    this.processEvent('annotationMouseLeave', {
                        context,
                        annnotationUrl,
                    }),
                handleEditAnnotation: (
                    url: string,
                    comment: string,
                    tags: string[],
                ) =>
                    this.processEvent('editAnnotation', {
                        context,
                        annotationUrl: url,
                        comment,
                        tags,
                    }),
                handleDeleteAnnotation: (annnotationUrl) =>
                    this.processEvent('deleteAnnotation', {
                        context,
                        annotationUrl: annnotationUrl,
                    }),
                handleBookmarkToggle: (annnotationUrl) =>
                    this.processEvent('toggleAnnotationBookmark', {
                        context,
                        annotationUrl: annnotationUrl,
                    }),
            }
        }

        const tagsEventProps = {
            fetchInitialTagSuggestions: () =>
                this.props.tags.fetchInitialTagSuggestions(),
            queryTagSuggestions: (query: string) =>
                this.props.tags.searchForTagSuggestions({ query }),
        }

        return (
            <Sidebar
                loadState={this.state.loadState}
                searchLoadState={this.state.searchLoadState}
                env={this.props.env}
                pageAnnotations={{
                    env: this.props.env,
                    highlighter: this.props.highlighter,
                    needsWaypoint: false,
                    annotations: this.state.annotations,
                    annotationModes: this.state.annotationModes.pageAnnotations,
                    activeAnnotationUrl: '',
                    hoverAnnotationUrl: this.state.hoverAnnotationUrl
                        .pageAnnotations,
                    appendLoader: false,
                    annotationEventHandlers: createAnnotationEventHandlers(
                        'pageAnnotations',
                    ),
                    handleScrollPagination: () => {},
                    showCongratsMessage: this.state.showCongratsMessage,
                    tagsEventProps,
                }}
                highlighter={this.props.highlighter}
                isOpen={this.state.state === 'visible'}
                showCommentBox={this.state.showCommentBox}
                searchValue={this.state.searchValue}
                pageInfo={{
                    page: this.state.page,
                    resetPage: () => {},
                }}
                pageType={this.state.pageType}
                showFiltersSidebar={this.state.showFiltersSidebar}
                showSocialSearch={false}
                closeSidebar={() => this.props.inPageUI.hideSidebar()}
                handleAddPageCommentBtnClick={() =>
                    this.processEvent('addNewPageComment', null)
                }
                pageDeleteDialog={{
                    isDeletePageModalShown:
                        this.state.deletePageModal.pageUrlToDelete != null,
                    handleDeletePage: () =>
                        this.processEvent('deletePage', null),
                    handleDeletePageModalClose: () =>
                        this.processEvent('closeDeletePageModal', null),
                }}
                onQueryEnter={(searchQuery) =>
                    this.processEvent('enterSearchQuery', { searchQuery })
                }
                onQueryChange={(searchQuery) => {
                    this.processEvent('changeSearchQuery', { searchQuery })
                }}
                onShowFiltersSidebarChange={() => {}}
                onOpenSettings={() => {}}
                clearAllFilters={() => {}}
                // Subcomponents
                commentBox={{
                    ...this.state.commentBox,
                    env: this.props.env,
                    isSocialPost: false,
                    form: {
                        env: this.props.env,
                        ...this.state.commentBox.form,
                        handleCommentTextChange: (comment: string) =>
                            this.processEvent('changePageCommentText', {
                                comment,
                            }),
                        cancelComment: () =>
                            this.processEvent('cancelNewPageComment', null),
                        toggleBookmark: () =>
                            this.processEvent(
                                'toggleNewPageCommentBookmark',
                                null,
                            ),
                        toggleTagPicker: () =>
                            this.processEvent(
                                'toggleNewPageCommentTagPicker',
                                null,
                            ),
                        updateTags: (args) =>
                            this.processEvent('updateTags', args),
                        ...tagsEventProps,
                    },
                    saveComment: (
                        anchor: Anchor,
                        commentText: string,
                        tags: string[],
                        bookmarked: boolean,
                    ) =>
                        this.processEvent('saveNewPageComment', {
                            anchor,
                            commentText,
                            tags,
                            bookmarked,
                        }),
                    onSaveCb: () => {},
                    closeComments: () => {
                        console
                        // .log('close comments')
                    },
                    // this.processEvent('closeComments', null),
                }}
                resultsContainer={{
                    needsWaypoint: false,
                    noResults: this.state.noResults,
                    isBadTerm: this.state.isBadTerm,
                    areAnnotationsExpanded: this.state.allAnnotationsExpanded,
                    shouldShowCount: this.state.shouldShowCount,
                    isInvalidSearch: this.state.isInvalidSearch,
                    totalResultCount: this.state.totalResultCount,
                    toggleAreAnnotationsExpanded: (
                        e: React.SyntheticEvent,
                    ) => {},

                    isNewSearchLoading:
                        this.state.searchLoadState !== 'success',
                    isListFilterActive: this.state.isListFilterActive,
                    resultsByUrl: this.state.resultsByUrl,
                    resultsClusteredByDay:
                        this.state.searchType === 'notes' &&
                        this.state.pageType === 'all',
                    annotsByDay: this.state.annotsByDay,
                    isSocialSearch: this.state.isSocialSearch,
                    highlighter: this.props.highlighter,
                    annotationModes: this.state.annotationModes.searchResults,
                    annotationEventHandlers: createAnnotationEventHandlers(
                        'searchResults',
                    ),
                    resetUrlDragged: () => {},
                    resetActiveTagIndex: () => {},
                    setUrlDragged: (url: string) => {},
                    updateTags: (url: string) => (args) =>
                        this.processEvent('updateTagsForPageResult', {
                            url,
                            ...args,
                        }),
                    updateLists: (url: string) => (args) =>
                        this.processEvent('updateListsForPageResult', {
                            url,
                            ...args,
                        }),
                    handlePillClick: (tag: string) => () => {
                        // console.log('handlePillClick')
                    },
                    handleTagBtnClick: (result) => {
                        this.processEvent('togglePageTagPicker', {
                            pageUrl: result.url,
                        })
                    },
                    handleListBtnClick: (result) => {
                        this.processEvent('togglePageListPicker', {
                            pageUrl: result.url,
                        })
                    },
                    handleCommentBtnClick: (result) => {
                        this.processEvent('togglePageAnnotationsView', {
                            pageUrl: result.url,
                        })
                    },
                    handleCrossRibbonClick: () => {
                        // console.log('handleCrossRibbonClick')
                    },
                    handleScrollPagination: () => {},
                    handleToggleBm: (result) => {
                        this.processEvent('togglePageBookmark', {
                            pageUrl: result.url,
                        })
                    },
                    handleTrashBtnClick: (result) => {
                        this.processEvent('showDeletePageModal', {
                            pageUrl: result.url,
                        })
                    },
                    ...tagsEventProps,
                    fetchInitialListSuggestions: () =>
                        this.props.customLists.fetchInitialListSuggestions(),
                    queryListSuggestions: (query: string) =>
                        this.props.customLists.searchForListSuggestions({
                            query,
                        }),
                }}
                searchTypeSwitch={{
                    allAnnotationsExpanded: this.state.allAnnotationsExpanded,
                    resultsSearchType: this.state.searchType,
                    searchType: this.state.searchType,
                    pageType: this.state.pageType,
                    pageCount: this.state.pageCount,
                    annotCount: this.state.annotCount,
                    handleAllAnnotationsFoldToggle: () =>
                        this.processEvent('toggleAllAnnotationsFold', null),
                    setSearchType: (type: 'notes' | 'page') =>
                        this.processEvent('setSearchType', { type }),
                    setPageType: (type: 'page' | 'all') =>
                        this.processEvent('setPageType', { type }),
                    setResultsSearchType: (type: 'page' | 'notes') =>
                        this.processEvent('setResultsSearchType', { type }),
                    setAnnotationsExpanded: (value: boolean) =>
                        this.processEvent('setAnnotationsExpanded', { value }),
                    handlePageTypeToggle: () => {
                        this.processEvent('togglePageType', null)
                    },
                    isOverview: this.props.env === 'overview',
                    handleAddPageCommentBtnClick: () =>
                        this.processEvent('addNewPageComment', null),
                    showSocialSearch: false,
                }}
                filtersSidebar={{
                    env: this.props.env,
                    showClearFiltersBtn: this.state.showClearFiltersBtn,
                    isSocialSearch: this.state.isSocialSearch,
                    clearAllFilters: () =>
                        this.processEvent('clearAllFilters', null),
                    fetchSuggestedTags: () =>
                        this.processEvent('fetchSuggestedTags', null),
                    fetchSuggestedDomains: () => () =>
                        this.processEvent('fetchSuggestedDomains', null),
                    fetchSuggestedUsers: () => {},
                    fetchSuggestedHashtags: () => {},
                    resetFilterPopups: () =>
                        this.processEvent('resetFiterPopups', null),
                    toggleShowFilters: () =>
                        this.processEvent('toggleShowFilters', null),
                }}
                topBar={{
                    env: this.props.env,
                    searchValue: this.state.searchValue,
                    showClearFiltersBtn: this.state.showClearFiltersBtn,
                    disableAddCommentBtn: this.state.showCommentBox,
                }}
            />
        )
    }
}
