import { storiesOf } from '@storybook/react'
import * as knobs from '@storybook/addon-knobs'
import React from 'react'
import Sidebar from 'src/in-page-ui/sidebar/react/components/sidebar'

const CREATED_WHEN = Date.now() - 1000 * 60 * 60

const stories = storiesOf('Sidebar - Integrfation', module)
stories.addDecorator(knobs.withKnobs)

stories.add('Random', () => (
    <Sidebar
        env={'inpage'}
        isOpen={true}
        isLoading={false}
        needsWaypoint={false}
        appendLoader={false}
        annotations={[]}
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
        closeSidebar={() => {}}
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
))
