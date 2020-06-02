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
    SidebarContainer as SidebarContainerUI,
} from 'src/in-page-ui/sidebar/react/containers/sidebar'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import { remoteFunction, runInBackground } from 'src/util/webextensionRPC'
import { AnnotationInterface } from 'src/direct-linking/background/types'
import { RemoteTagsInterface } from 'src/tags/background/types'
import { BookmarksInterface } from 'src/bookmarks/background/types'
import { SearchInterface } from 'src/search/background/types'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { renderHighlights } from 'src/highlighting/ui/highlight-interactions'
import { insertTooltip } from 'src/in-page-ui/tooltip/content_script/interactions'
import AnnotationsManager from 'src/annotations/annotations-manager'

const resultItemStyles = require('src/common-ui/components/result-item.css')

export default class DashboardResultsContainer extends StatefulUIElement<
    DashboardResultsDependencies,
    DashboardResultsState,
    DashboardResultsEvent
> {
    constructor(props: DashboardResultsDependencies) {
        super(props, new DashboardResultsLogic(props))
    }

    private sidebarContainer: SidebarContainerUI

    private setRefSidebarContainer = (sidebar) => {
        this.sidebarContainer = sidebar
    }

    // handleToggleAnnotationsSidebar = (args: {
    //     pageUrl: string
    //     pageTitle: string
    // }) => this.processEvent('handleToggleAnnotationsSidebar', args)

    private handleAnnotationSidebarToggle = async (args?: {
        pageUrl: string
        pageTitle?: string
    }) => {
        const isAlreadyOpenForOtherPage =
            args.pageUrl !== this.sidebarContainer.state.showAnnotsForPage?.url

        if (
            this.sidebarContainer.state.state === 'hidden' ||
            isAlreadyOpenForOtherPage
        ) {
            await this.sidebarContainer.processEvent(
                'togglePageAnnotationsView',
                args,
            )
            this.sidebarContainer.showSidebar()
        } else if (this.sidebarContainer.state.state === 'visible') {
            this.sidebarContainer.hideSidebar()
        }
    }
    private setActiveAnnotationUrl = (url) =>
        this.sidebarContainer.processEvent('setActiveAnnotationUrl', url)

    private handleClickOutsideSidebar: React.MouseEventHandler = (e) => {
        const wasResultAnnotBtnClicked = (e.target as HTMLElement)?.classList?.contains(
            resultItemStyles.commentBtn,
        )

        if (
            !wasResultAnnotBtnClicked &&
            this.sidebarContainer.state.state === 'visible'
        ) {
            this.sidebarContainer.hideSidebar()
        }
    }

    readerClose = () => this.processEvent('handleReaderClose', {})

    handleReaderViewClick = (url: string) => {
        return this.processEvent('handleReaderViewClick', url)
    }

    readerLoaded = async ({ url, title }) => {
        // load annotations
        await this.loadAndRenderAnnotations(url, ({ activeUrl }) => {
            this.handleAnnotationSidebarToggle({
                pageUrl: url,
                pageTitle: title,
            })
            this.setActiveAnnotationUrl(activeUrl)
        })
        await insertTooltip({
            inPageUI: this.state.dashboardUI,
            annotationsManager: new AnnotationsManager(),
            toolbarNotifications: null,
        })
    }
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
                    setRef={this.setRefSidebarContainer}
                    highlighter={this.state.highlighter as any}
                    onClickOutside={this.handleClickOutsideSidebar}
                    searchResultLimit={10}
                />
            </>
        )
    }
}
