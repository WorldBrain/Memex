import * as React from 'react'
import {
    SidebarContainerDependencies,
    SidebarContainerState,
    SidebarContainerLogic,
    SidebarContainerEvents,
} from './logic'
import { StatefulUIElement } from 'src/util/ui-logic'
import Sidebar from '../../components/sidebar'
import { Anchor } from 'src/highlighting/types'

export interface SidebarContainerProps extends SidebarContainerDependencies {}

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
        this.props.sidebarEvents.on('showSidebar', this.showSidebar)
        this.props.sidebarEvents.on('hideSidebar', this.hideSidebar)
    }

    componentWillUnmount() {
        super.componentWillUnmount()
        this.props.sidebarEvents.removeListener('showSidebar', this.showSidebar)
        this.props.sidebarEvents.removeListener('hideSidebar', this.hideSidebar)
    }

    showSidebar = () => {
        this.processEvent('show', null)
    }

    hideSidebar = () => {
        this.processEvent('hide', null)
    }

    render() {
        const isLoading = this.state.loadState !== 'success'
        return (
            <Sidebar
                env={this.props.env}
                isOpen={this.state.state === 'visible'}
                isLoading={isLoading}
                needsWaypoint={this.state.needsWaypoint}
                appendLoader={this.state.appendLoader}
                annotations={this.state.annotations}
                activeAnnotationUrl={this.state.activeAnnotationUrl}
                hoverAnnotationUrl={this.state.hoverAnnotationUrl}
                showCommentBox={this.state.showCommentBox}
                searchValue={this.state.searchValue}
                showCongratsMessage={this.state.showCongratsMessage}
                page={this.state.page}
                pageType={this.state.pageType}
                showFiltersSidebar={this.state.showFiltersSidebar}
                showSocialSearch={false}
                annotationModes={this.state.annotationModes}
                closeSidebar={() =>
                    this.props.sidebarEvents.emit('requestCloseSidebar')
                }
                handleAddPageCommentBtnClick={() =>
                    this.processEvent('addNewPageComment', null)
                }
                annotationProps={{
                    handleAnnotationTagClick: event => {},
                    handleAnnotationModeSwitch: event =>
                        this.processEvent('handleAnnotationModeSwitch', event),
                    handleGoToAnnotation: annnotation =>
                        this.processEvent('goToAnnotation', { annnotation }),
                    handleAnnotationBoxMouseEnter: () =>
                        console.log('handleAnnotationBoxMouseEnter'),
                    handleAnnotationBoxMouseLeave: () =>
                        console.log('handleAnnotationBoxMouseLeave'),
                    handleEditAnnotation: annnotationUrl =>
                        this.processEvent('editAnnotation', { annnotationUrl }),
                    handleDeleteAnnotation: annnotationUrl =>
                        this.processEvent('deleteAnnotation', {
                            annnotationUrl,
                        }),
                }}
                handleScrollPagination={() =>
                    console.log('handleScrollPagination')
                }
                handleAnnotationBookmarkToggle={annnotationUrl =>
                    this.processEvent('toggleAnnotationBookmark', {
                        annnotationUrl,
                    })
                }
                onQueryKeyDown={() => {}}
                onQueryChange={searchQuery => {
                    this.processEvent('changeSearchQuery', { searchQuery })
                }}
                onShowFiltersSidebarChange={() => {}}
                onOpenSettings={() => {}}
                clearAllFilters={() => {}}
                resetPage={() => {}}
                // Subcomponents
                commentBox={{
                    ...this.state.commentBox,
                    env: this.props.env,
                    isSocialPost: false,
                    highlighter: {} as any,
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
                    isLoading,
                    needsWaypoint: this.state.needsWaypoint,
                    noResults: this.state.noResults,
                    isBadTerm: this.state.isBadTerm,
                    areAnnotationsExpanded: this.state.areAnnotationsExpanded,
                    shouldShowCount: this.state.shouldShowCount,
                    isInvalidSearch: this.state.isInvalidSearch,
                    totalResultCount: this.state.totalResultCount,
                    toggleAreAnnotationsExpanded: (
                        e: React.SyntheticEvent,
                    ) => {},

                    isNewSearchLoading: this.state.isNewSearchLoading,
                    isListFilterActive: this.state.isListFilterActive,
                    searchResults: this.state.searchResults,
                    resultsByUrl: this.state.resultsByUrl,
                    resultsClusteredByDay: this.state.resultsClusteredByDay,
                    annotsByDay: this.state.annotsByDay,
                    isSocialSearch: this.state.isSocialSearch,
                    tagSuggestions: this.state.tagSuggestions,
                    resetUrlDragged: () => {},
                    resetActiveTagIndex: () => {},
                    setUrlDragged: (url: string) => {},
                    addTag: (i: number) => (f: string) => {},
                    delTag: (i: number) => (f: string) => {},
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
                    annotsFolded: this.state.annotsFolded,
                    resultsSearchType: this.state.resultsSearchType,
                    searchType: this.state.searchType,
                    pageType: this.state.pageType,
                    pageCount: this.state.pageCount,
                    annotCount: this.state.annotCount,
                    handleUnfoldAllClick: () => {},
                    setSearchType: (type: 'notes' | 'page') =>
                        this.processEvent('setSearchType', { type }),
                    setPageType: (type: 'page' | 'all') =>
                        this.processEvent('setPageType', { type }),
                    setResultsSearchType: (type: 'page' | 'notes' | 'social') =>
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
