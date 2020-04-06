import * as React from 'react'
import {
    SidebarContainerDependencies,
    SidebarContainerState,
    SidebarContainerLogic,
    SidebarContainerEvents,
} from './logic'
import { StatefulUIElement } from 'src/util/ui-logic'
import Sidebar from '../../components/sidebar'

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
        return (
            <Sidebar
                // Main sidebar props
                env={this.props.env}
                isOpen={this.state.state === 'visible'}
                isLoading={this.state.loadState === 'success'}
                needsWaypoint={false}
                appendLoader={false}
                annotations={this.state.annotations}
                activeAnnotationUrl={''}
                hoverAnnotationUrl={''}
                showCommentBox={false}
                searchValue={''}
                showCongratsMessage={false}
                showClearFiltersBtn={false}
                isSocialPost={false}
                page={{} as any}
                pageType={'page'}
                searchType={'notes'}
                closeSidebar={() =>
                    this.props.sidebarEvents.emit('requestCloseSidebar')
                }
                handleGoToAnnotation={() => {}}
                handleAddCommentBtnClick={() => {}}
                handleAnnotationBoxMouseEnter={() => {}}
                handleAnnotationBoxMouseLeave={() => {}}
                handleEditAnnotation={() => {}}
                handleDeleteAnnotation={() => {}}
                handleScrollPagination={() => {}}
                handleBookmarkToggle={() => {}}
                onQueryKeyDown={() => {}}
                onQueryChange={() => {}}
                onShowFiltersSidebarChange={() => {}}
                onOpenSettings={() => {}}
                clearAllFilters={() => {}}
                resetPage={() => {}}
                // Filter sidebar props
                showFiltersSidebar={false}
                showSocialSearch={false}
                annotsFolded={false}
                resultsSearchType={'page'}
                pageCount={0}
                annotCount={0}
                handleUnfoldAllClick={() => {}}
                setSearchType={() => {}}
                setPageType={() => {}}
                setResultsSearchType={() => {}}
                setAnnotationsExpanded={() => {}}
                handlePageTypeToggle={() => {}}
                // Search result props
                noResults={false}
                isBadTerm={false}
                areAnnotationsExpanded={false}
                shouldShowCount={false}
                isInvalidSearch={false}
                totalResultCount={0}
                toggleAreAnnotationsExpanded={(e: React.SyntheticEvent) => {}}
                isNewSearchLoading={false}
                isListFilterActive={false}
                searchResults={[]}
                resultsByUrl={new Map()}
                resultsClusteredByDay={false}
                annotsByDay={{}}
                isSocialSearch={false}
                tagSuggestions={[]}
                resetUrlDragged={() => {}}
                resetActiveTagIndex={() => {}}
                setUrlDragged={(url: string) => {}}
                addTag={(i: number) => (f: string) => {}}
                delTag={(i: number) => (f: string) => {}}
                handlePillClick={(tag: string) => () => {}}
                handleTagBtnClick={(i: number) => () => {}}
                handleCommentBtnClick={() => {}}
                handleCrossRibbonClick={() => () => {}}
                handleToggleBm={() => () => {}}
                handleTrashBtnClick={() => () => {}}
            />
        )
    }
}
