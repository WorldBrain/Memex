import { storiesOf } from '@storybook/react'
import * as knobs from '@storybook/addon-knobs'
import React from 'react'
import Sidebar from 'src/in-page-ui/sidebar/react/components/sidebar'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { BackgroundIntegrationTestSetup } from 'src/tests/integration-tests'
import SidebarContainer from 'src/in-page-ui/sidebar/react/containers/sidebar'
import { InPageUI } from 'src/in-page-ui/shared-state'

const CREATED_WHEN = Date.now() - 1000 * 60 * 60

class WithDependencies<Dependencies> extends React.Component<
    {
        setup: () => Promise<Dependencies>
        children: (dependencies: Dependencies) => React.ReactNode
    },
    { dependencies?: Dependencies }
> {
    state: { dependencies?: Dependencies } = {}

    async componentDidMount() {
        this.setState({ dependencies: await this.props.setup() })
    }

    render() {
        if (!this.state.dependencies) {
            return null
        }
        return this.props.children(this.state.dependencies)
    }
}

const stories = storiesOf('Sidebar', module)
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

stories.add('Dynamic - In page', () => (
    <WithDependencies
        setup={async () => {
            const testSetup = await setupBackgroundIntegrationTest()
            await testSetup.backgroundModules.directLinking.annotationStorage.createAnnotation(
                {
                    pageTitle: 'Page title',
                    pageUrl: 'foo.com',
                    url: 'foo.com#4r234523453',
                    body: 'Annotation body',
                    comment: 'Annotation comment',
                    createdWhen: new Date(),
                },
            )
            return {
                testSetup,
                inPageUIController: null,
            }
        }}
    >
        {({ testSetup }) => (
            <SidebarContainer
                env={'inpage'}
                currentTab={{ id: 654, url: 'https://www.foo.com' }}
                sidebarEvents={
                    {
                        on: () => {},
                        removeListener: () => {},
                    } as any
                }
                loadAnnotatons={url =>
                    testSetup.backgroundModules.directLinking.getAllAnnotationsByUrl(
                        { tab: null },
                        { url },
                    )
                }
            />
        )}
    </WithDependencies>
))
