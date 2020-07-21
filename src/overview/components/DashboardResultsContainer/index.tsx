import { StatefulUIElement } from 'src/util/ui-logic'
import {
    DashboardResultsDependencies,
    DashboardResultsEvent,
    DashboardResultsState,
} from 'src/overview/components/DashboardResultsContainer/types'
import DashboardResultsLogic from 'src/overview/components/DashboardResultsContainer/logic'
import Overview from 'src/overview/components/Overview'
import React from 'react'
import ViewerModal from 'src/reader/components/ViewerModal'
import { remoteFunction, runInBackground } from 'src/util/webextensionRPC'
import { AnnotationInterface } from 'src/annotations/background/types'
import { RemoteTagsInterface } from 'src/tags/background/types'
import { BookmarksInterface } from 'src/bookmarks/background/types'
import { SearchInterface } from 'src/search/background/types'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { renderHighlights } from 'src/highlighting/ui/highlight-interactions'
import AnnotationsSidebar from 'src/sidebar/annotations-sidebar/components/AnnotationsSidebar'
import { TaskState } from 'ui-logic-react/lib/types'
import { AnnotationCreateGeneralProps } from 'src/annotations/components/AnnotationCreate'
import { Annotation } from 'src/annotations/types'

const resultItemStyles = require('src/common-ui/components/result-item.css')

export default class DashboardResultsContainer extends StatefulUIElement<
    DashboardResultsDependencies,
    DashboardResultsState,
    DashboardResultsEvent
> {
    constructor(props: DashboardResultsDependencies) {
        super(props, new DashboardResultsLogic(props))
    }

    // TODO: (sidebar-refactor) - Remove the sidebar reference
    // private sidebarContainer: SidebarContainerUI
    //
    // private setRefSidebarContainer = (sidebar) => {
    //     this.sidebarContainer = sidebar
    // }

    handleToggleAnnotationsSidebar = (args: {
        pageUrl: string
        pageTitle: string
    }) => this.processEvent('handleToggleAnnotationsSidebar', args)

    // TODO: (sidebar-refactor, priority 1) - Reimplement this communication between dashboard and new annotations sidebar
    // via... dashboard specific glue class or component, probably binding events and handlers or just using the state that's needed to be shared.
    //
    private handleAnnotationSidebarToggle = async (args?: {
        pageUrl: string
        pageTitle?: string
    }) => {
        //     const isAlreadyOpenForOtherPage =
        //         args.pageUrl !== this.sidebarContainer.state.showAnnotsForPage?.url
        //
        //     if (
        //         this.sidebarContainer.state.state === 'hidden' ||
        //         isAlreadyOpenForOtherPage
        //     ) {
        //         await this.sidebarContainer.processEvent(
        //             'togglePageAnnotationsView',
        //             args,
        //         )
        //         this.sidebarContainer.showSidebar()
        //     } else if (this.sidebarContainer.state.state === 'visible') {
        //         this.sidebarContainer.hideSidebar()
        //     }
    }
    // private setActiveAnnotationUrl = (url) =>
    //     this.sidebarContainer.processEvent('setActiveAnnotationUrl', url)
    //
    // private handleClickOutsideSidebar: React.MouseEventHandler = (e) => {
    //     const wasResultAnnotBtnClicked = (e.target as HTMLElement)?.classList?.contains(
    //         resultItemStyles.commentBtn,
    //     )
    //
    //     if (
    //         !wasResultAnnotBtnClicked &&
    //         this.sidebarContainer.state.state === 'visible'
    //     ) {
    //         this.sidebarContainer.hideSidebar()
    //     }
    // }

    readerClose = () => this.processEvent('handleReaderClose', {})

    handleReaderViewClick = (url: string) => {
        return this.processEvent('handleReaderViewClick', url)
    }

    readerLoaded = async ({ url, title }) => {
        // load annotations
        // TODO: (sidebar-refactor, priority 1) - Reimplement this communication between dashboard....
        // await this.loadAndRenderAnnotations(url, ({ activeUrl }) => {
        //     this.handleAnnotationSidebarToggle({
        //         pageUrl: url,
        //         pageTitle: title,
        //     })
        //     this.setActiveAnnotationUrl(activeUrl)
        // })
    }

    // TODO: (sidebar-refactor, priority 1) -
    loadAndRenderAnnotations = async (
        fullUrl: string,
        onAnnotationClick: (args: { activeUrl?: string }) => void,
    ) => {
        const annots = await remoteFunction('getAllAnnotationsByUrl')({
            url: fullUrl,
        })
        // console.log(`Found ${annots?.length} annots for url`)
        // console.dir(annots)
        const highlightables = annots.filter(
            (annotation) => annotation.selector,
        )
        await renderHighlights(highlightables, onAnnotationClick)
    }

    render() {
        return (
            <>
                <Overview
                    toggleAnnotationsSidebar={
                        this.handleAnnotationSidebarToggle
                    }
                    handleReaderViewClick={this.handleReaderViewClick}
                />

                {this.state.readerShow && (
                    <ViewerModal
                        fullUrl={this.state.readerUrl}
                        handleClose={this.readerClose}
                        onInit={this.readerLoaded}
                    />
                )}

                {/*<AnnotationsSidebar*/}
                {/*    createAnnotation={runInBackground<*/}
                {/*        AnnotationInterface<'caller'>*/}
                {/*    >()}*/}
                {/*    tags={runInBackground<RemoteTagsInterface>()}*/}
                {/*    bookmarks={runInBackground<BookmarksInterface>()}*/}
                {/*    search={runInBackground<SearchInterface>()}*/}
                {/*    customLists={runInBackground<RemoteCollectionsInterface>()}*/}
                {/*    inPageUI={this.state.dashboardSharedUIState}*/}
                {/*    setRef={this.setRefSidebarContainer}*/}
                {/*    highlighter={this.state.highlighter as any}*/}
                {/*    onClickOutside={this.handleClickOutsideSidebar}*/}
                {/*    searchResultLimit={10}*/}
                {/*/>*/}

                {/* There needs to be an appropriate wrapper/factory here to provide the props*/}
                {/*
                <AnnotationsSidebar
                    isSearchLoading={false},
                    annotationCreateProps={},
                    annotationEditProps={},
                    isAnnotationCreateShown={true},
                    annotations= {},
                    onSearch={() => []},
                />*/}
            </>
        )
    }
}
