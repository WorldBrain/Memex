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
import SidebarContainer, {
    SidebarContainer as AnnotationsSidebar,
} from 'src/in-page-ui/sidebar/react/containers/sidebar'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import { runInBackground } from 'src/util/webextensionRPC'
import { AnnotationInterface } from 'src/direct-linking/background/types'
import { RemoteTagsInterface } from 'src/tags/background/types'
import { BookmarksInterface } from 'src/bookmarks/background/types'
import { SearchInterface } from 'src/search/background/types'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'

const resultItemStyles = require('src/common-ui/components/result-item.css')

export default class DashboardResultsContainer extends StatefulUIElement<
    DashboardResultsDependencies,
    DashboardResultsState,
    DashboardResultsEvent
> {
    constructor(props: DashboardResultsDependencies) {
        super(props, new DashboardResultsLogic(props))
    }

    private annotationsSidebar: AnnotationsSidebar

    private setAnnotsSidebarRef = (sidebar) => {
        this.annotationsSidebar = sidebar
    }

    private handleAnnotationSidebarToggle = async (args?: {
        pageUrl: string
        pageTitle?: string
    }) => {
        const isAlreadyOpenForOtherPage =
            args.pageUrl !==
            this.annotationsSidebar.state.showAnnotsForPage?.url

        if (
            this.annotationsSidebar.state.state === 'hidden' ||
            isAlreadyOpenForOtherPage
        ) {
            await this.annotationsSidebar.processEvent(
                'togglePageAnnotationsView',
                args,
            )
            this.annotationsSidebar.showSidebar()
        } else if (this.annotationsSidebar.state.state === 'visible') {
            this.annotationsSidebar.hideSidebar()
        }
    }

    private handleClickOutsideSidebar: React.MouseEventHandler = (e) => {
        const wasResultAnnotBtnClicked = (e.target as HTMLElement)?.classList?.contains(
            resultItemStyles.commentBtn,
        )

        if (
            !wasResultAnnotBtnClicked &&
            this.annotationsSidebar.state.state === 'visible'
        ) {
            this.annotationsSidebar.hideSidebar()
        }
    }

    readerClose = () => this.processEvent('handleReaderClose', {})

    handleToggleAnnotationsSidebar = (args: {
        pageUrl: string
        pageTitle: string
    }) => this.processEvent('handleToggleAnnotationsSidebar', args)

    handleReaderViewClick = (url: string) =>
        this.processEvent('handleReaderViewClick', url)

    render() {
        return (
            <>
                <Overview
                    toggleAnnotationsSidebar={
                        this.handleToggleAnnotationsSidebar
                    }
                    handleReaderViewClick={this.handleReaderViewClick}
                />

                {this.state.readerShow && (
                    <ViewerModal
                        fullUrl={this.state.readerUrl}
                        handleClose={this.readerClose}
                    />
                )}

                {/* NOTE: most of these deps are unused in the overview's usage of the sidebar
                    - perhaps we should make a separate simplified interface for overview usage? */}
                <SidebarContainer
                    env="overview"
                    normalizeUrl={normalizeUrl}
                    currentTab={{ url: 'http://worldbrain.io' } as any}
                    annotations={runInBackground<
                        AnnotationInterface<'caller'>
                    >()}
                    tags={runInBackground<RemoteTagsInterface>()}
                    bookmarks={runInBackground<BookmarksInterface>()}
                    search={runInBackground<SearchInterface>()}
                    customLists={runInBackground<RemoteCollectionsInterface>()}
                    inPageUI={this.state.dashboardUI}
                    setRef={this.setAnnotsSidebarRef}
                    highlighter={this.state.highlighter as any}
                    onClickOutside={this.handleClickOutsideSidebar}
                    searchResultLimit={10}
                />
            </>
        )
    }
}
