import React from 'react'
import { StatefulUIElement } from 'src/util/ui-logic'
import {
    PdfViewerDependencies,
    PdfViewerResultsEvent,
    PdfViewerResultsState,
} from 'src/pdf-viewer/PdfViewerContainer/types.ts'

import PdfViewerResultsLogic from 'src/pdf-viewer/PdfViewerContainer/logic'
import PDFJS from 'pdfjs-dist'

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
const styles = require('./index.css')

export default class PdfViewerResultsContainer extends StatefulUIElement<
    PdfViewerDependencies,
    PdfViewerResultsState,
    PdfViewerResultsEvent
> {
    constructor(props: PdfViewerDependencies) {
        super(props, new PdfViewerResultsLogic(props))
    }

    async componentDidMount() {
        let pdfUrl = await remoteFunction('getPdfUrl')(this.props.params.pdfId)
        pdfUrl = `https://${pdfUrl}`
        this.renderPDFViewer({
            pdfUrl,
            containerId: 'pdf-viewer-container',
            scale: 2,
            pageClass: 'pdf-viewer__page',
            canvasClass: 'pdf-viewer__canvas',
            textLayerClass: 'pdf-viewer__text-layer',
        })
    }

    private sidebarContainer: SidebarContainerUI

    private setRefSidebarContainer = (sidebar) => {
        this.sidebarContainer = sidebar
    }

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

    private renderPageContent = async ({
        parentDiv,
        page,
        scale,
        pageClass,
        canvasClass,
        textLayerClass,
    }) => {
        const div = document.createElement('div')

        div.setAttribute('id', 'page-' + (page.pageIndex + 1))
        div.setAttribute('style', 'position: relative')
        div.setAttribute('class', pageClass)

        parentDiv.appendChild(div)

        const canvas = document.createElement('canvas')
        const viewport = page.getViewport(scale)

        div.appendChild(canvas)

        canvas.setAttribute('class', canvasClass)
        canvas.height = viewport.height
        canvas.width = viewport.width

        await page.render({
            canvasContext: canvas.getContext('2d'),
            viewport,
        })

        // Render a text layer so text is selectable
        const textLayerDiv = document.createElement('div')
        textLayerDiv.setAttribute('class', `${styles.textLayer}`)
        textLayerDiv.setAttribute('style', `position: absolute`)
        div.appendChild(textLayerDiv)

        await PDFJS.renderTextLayer({
            textContent: await page.getTextContent(),
            container: textLayerDiv,
            viewport,
        })
    }

    renderPDFViewer = async ({ pdfUrl, containerId, ...args }) => {
        // console.log('inside pdf viewer renderer', pdfUrl)
        const pdf = await PDFJS.getDocument(pdfUrl)
        const container = document.getElementById(containerId)

        for (let pageNum = 1; pageNum <= pdf.numPages; ++pageNum) {
            await this.renderPageContent({
                parentDiv: container,
                page: await pdf.getPage(pageNum),
                ...args,
            })
        }
    }

    readerClose = () => this.processEvent('handleViewerClose', {})

    handleReaderViewClick = (url: string) => {
        return this.processEvent('handlePdfViewClick', url)
    }

    pdfViewerLoaded = async ({ url, title }) => {
        // load annotations
        await this.loadAndRenderAnnotations(url, ({ activeUrl }) => {
            this.handleAnnotationSidebarToggle({
                pageUrl: url,
                pageTitle: title,
            })
            this.setActiveAnnotationUrl(activeUrl)
        })
        await insertTooltip({
            inPageUI: this.state.pdfUI,
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
                <div className={styles.container}>
                    <div id="pdf-viewer-container" className="pdf-viewer" />
                </div>
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
                    inPageUI={this.state.pdfUI}
                    setRef={this.setRefSidebarContainer}
                    highlighter={this.state.highlighter as any}
                    onClickOutside={this.handleClickOutsideSidebar}
                    searchResultLimit={10}
                />
            </>
        )
    }
}
