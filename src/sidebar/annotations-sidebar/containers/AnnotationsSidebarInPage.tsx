import * as React from 'react'
import ReactDOM from 'react-dom'

import { HighlightInteractionInterface } from 'src/highlighting/types'
import {
    SharedInPageUIEvents,
    SidebarActionOptions,
    SharedInPageUIInterface,
} from 'src/in-page-ui/shared-state/types'
import {
    AnnotationsSidebarContainer,
    Props as ContainerProps,
} from './AnnotationsSidebarContainer'
import { AnnotationsSidebarInPageEventEmitter } from '../types'

export interface Props extends ContainerProps {
    events: AnnotationsSidebarInPageEventEmitter
    inPageUI: SharedInPageUIInterface
    highlighter: HighlightInteractionInterface
}

export class AnnotationSidebarInPage extends AnnotationsSidebarContainer<
    Props
> {
    componentDidMount() {
        super.componentDidMount()
        this.setupEventForwarding()
    }

    componentWillUnmount() {
        super.componentWillUnmount()
        this.cleanupEventForwarding()
    }

    private setupEventForwarding() {
        const { inPageUI, highlighter } = this.props

        inPageUI.events.on('stateChanged', this.handleInPageUIStateChange)
        inPageUI.events.on('sidebarAction', this.handleExternalAction)

        this.props.events.on('removeTemporaryHighlights', () =>
            highlighter.removeTempHighlights(),
        )
        this.props.events.on('highlightAndScroll', ({ url }) =>
            highlighter.highlightAndScroll({ url } as any),
        )
        this.props.events.on('removeAnnotationHighlights', ({ url }) =>
            highlighter.removeAnnotationHighlights(url),
        )
        this.props.events.on('renderHighlight', ({ highlight }) =>
            highlighter.renderHighlight(highlight, () => {
                inPageUI.showSidebar({
                    anchor: highlight.selector as any,
                    annotationUrl: highlight.url,
                    action: 'show_annotation',
                })
            }),
        )
    }

    private cleanupEventForwarding() {
        this.props.inPageUI.events.removeAllListeners('stateChanged')
        this.props.inPageUI.events.removeAllListeners('sidebarAction')

        for (const event of this.props.events.eventNames()) {
            this.props.events.removeAllListeners(event)
        }
    }

    private getDocument(): Document {
        const containerNode = ReactDOM.findDOMNode(this)
        return containerNode.getRootNode() as Document
    }

    private activateAnnotation(url: string) {
        this.processEvent('setActiveAnnotationUrl', url)
        const annotationBoxNode = this.getDocument().getElementById(url)

        if (!annotationBoxNode) {
            return
        }

        annotationBoxNode.scrollIntoView({
            block: 'center',
            behavior: 'smooth',
        })
    }

    private handleExternalAction = (event: SidebarActionOptions) => {
        if (event.action === 'annotate' || event.action === 'comment') {
            this.processEvent('addNewPageComment', null)
            if (event.anchor) {
                this.processEvent('setNewPageCommentAnchor', {
                    anchor: event.anchor,
                })
            }
        }

        if (event.action === 'show_annotation') {
            this.activateAnnotation(event.annotationUrl)
        }

        this.forceUpdate()
    }

    private handleInPageUIStateChange: SharedInPageUIEvents['stateChanged'] = ({
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

    protected hideSidebar = () => {
        super.hideSidebar()
        this.props.inPageUI.hideRibbon()
        this.props.inPageUI.hideSidebar()
    }

    protected getCreateProps = () => {
        const props = super.getCreateProps()

        return {
            ...props,
            onCancel: () => {
                props.onCancel()
                this.props.highlighter.removeTempHighlights()
            },
        }
    }

    protected getEditProps = () => {
        const props = super.getEditProps()

        return {
            ...props,
            handleConfirmDelete: (url) => {
                props.handleConfirmDelete(url)
                this.props.highlighter.removeAnnotationHighlights(url)
            },
        }
    }
}
