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
        this.props.sidebarController.events.on('showSidebar', this.showSidebar)
        this.props.sidebarController.events.on('hideSidebar', this.hideSidebar)
    }

    componentWillUnmount() {
        super.componentWillUnmount()
        this.props.sidebarController.events.removeListener(
            'showSidebar',
            this.showSidebar,
        )
        this.props.sidebarController.events.removeListener(
            'hideSidebar',
            this.hideSidebar,
        )
    }

    showSidebar = () => {
        this.processEvent('show', null)
    }

    hideSidebar = () => {
        this.processEvent('hide', null)
    }

    render() {
        console.log(this.state)
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
                handleGoToAnnotation: annnotationUrl =>
                    this.processEvent('goToAnnotation', {
                        context,
                        annnotationUrl,
                    }),
                handleMouseEnter: annnotationUrl =>
                    this.processEvent('annotationMouseEnter', {
                        context,
                        annnotationUrl,
                    }),
                handleMouseLeave: annnotationUrl =>
                    this.processEvent('annotationMouseLeave', {
                        context,
                        annnotationUrl,
                    }),
                handleEditAnnotation: annnotationUrl =>
                    this.processEvent('editAnnotation', {
                        context,
                        annnotationUrl,
                    }),
                handleDeleteAnnotation: annnotationUrl =>
                    this.processEvent('deleteAnnotation', {
                        context,
                        annnotationUrl,
                    }),
                handleBookmarkToggle: annnotationUrl =>
                    this.processEvent('toggleAnnotationBookmark', {
                        context,
                        annnotationUrl,
                    }),
            }
        }
        // console.log(this.state)

        return (
            <Sidebar
                loadState={this.state.loadState}
                annotationLoadState={this.state.annotationLoadState}
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
                closeSidebar={() =>
                    this.props.sidebarController.events.emit(
                        'requestCloseSidebar',
                    )
                }
                handleAddPageCommentBtnClick={() =>
                    this.processEvent('addNewPageComment', null)
                }
                pageDeleteDialog={{
                    isDeletePageModelShown: this.state.deletePagesModel
                        .isDeletePagesModelShown,
                    handleDeletePages: () =>
                        this.processEvent('deletePages', null),
                    handleDeletePagesModalClose: () =>
                        this.processEvent('closeDeletePagesModal', null),
                }}
                onQueryKeyDown={() => {}}
                onQueryChange={searchQuery => {
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
                        addTag: tag =>
                            this.processEvent('addNewPageCommentTag', { tag }),
                        deleteTag: tag =>
                            this.processEvent('deleteNewPageCommentTag', {
                                tag,
                            }),
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
                    closeComments: () => console.log('close comments'),
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
                    searchResults: this.state.searchResults,
                    resultsByUrl: this.state.resultsByUrl,
                    resultsClusteredByDay:
                        this.state.searchType === 'notes' &&
                        this.state.pageType === 'all',
                    annotsByDay: this.state.annotsByDay,
                    isSocialSearch: this.state.isSocialSearch,
                    tagSuggestions: this.state.tagSuggestions,
                    highlighter: this.props.highlighter,
                    annotationModes: this.state.annotationModes.searchResults,
                    annotationEventHandlers: createAnnotationEventHandlers(
                        'searchResults',
                    ),
                    resetUrlDragged: () => {},
                    resetActiveTagIndex: () => {},
                    setUrlDragged: (url: string) => {},
                    addTag: (i: number) => (filter: string) => {},
                    delTag: (i: number) => (filter: string) => {},
                    handlePillClick: (tag: string) => () =>
                        console.log('handlePillClick'),
                    handleTagBtnClick: (i: number) => () =>
                        console.log('handleTagBtnClick'),
                    handleCommentBtnClick: () =>
                        console.log('handleCommentBtnClick'),
                    handleCrossRibbonClick: () => () =>
                        console.log('handleCrossRibbonClick'),
                    handleScrollPagination: () => {},
                    handleToggleBm: () => () => console.log('handleToggleBm'),
                    handleTrashBtnClick: () => () =>
                        console.log('handleTrashBtnClick'),
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
