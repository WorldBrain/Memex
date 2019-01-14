import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { connect, MapStateToProps } from 'react-redux'

import { makeRemotelyCallable } from '../../util/webextensionRPC'
import RootState, { MapDispatchToProps } from '../types'
import RibbonContainer, {
    actions as ribbonActions,
    selectors as ribbonSelectors,
} from '../ribbon'
import SidebarContainer, {
    actions as sidebarActions,
    selectors as sidebarSelectors,
} from '../../sidebar-common'
import { Annotation } from '../../sidebar-common/types'
import { actions as commentBoxActions } from '../../sidebar-common/comment-box'
import AnnotationsManager from '../../sidebar-common/annotations-manager'
import { Anchor } from '../../direct-linking/content_script/interactions'
import { retryUntilErrorResolves } from '../utils'

interface StateProps {
    isPageFullScreen: boolean
    isSidebarOpen: boolean
    annotations: Annotation[]
}

interface DispatchProps {
    handleToggleFullScreen: (e: Event) => void
    openSidebar: () => void
    openCommentBoxWithHighlight: (anchor: Anchor) => void
}

interface OwnProps {
    annotationsManager: AnnotationsManager
    handleRemoveRibbon: () => void
    highlightAll: (
        highlights: Annotation[],
        focusOnAnnotation: (url: string) => void,
        hoverAnnotationContainer: (url: string) => void,
    ) => void
    highlightAndScroll: (annotation: Annotation) => number
    removeHighlights: () => void
}

type Props = StateProps & DispatchProps & OwnProps

class RibbonSidebarContainer extends React.PureComponent<Props> {
    private _sidebarRef: React.Component = null

    componentDidMount() {
        this._setupFullScreenListener()
        this._setupRPC()
    }

    componentWillUnmount() {
        this._removeFullScreenListener()
    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.annotations !== this.props.annotations) {
            this._highlightAnnotations()
        }
    }

    private _setupRPC = () => {
        makeRemotelyCallable({
            openSidebar: this._openSidebar,
            goToAnnotation: this._goToAnnotation,
        })
    }

    private _setupFullScreenListener = () => {
        const { handleToggleFullScreen } = this.props
        document.addEventListener('fullscreenchange', handleToggleFullScreen)
    }

    private _removeFullScreenListener = () => {
        const { handleToggleFullScreen } = this.props
        document.removeEventListener('fullscreenchange', handleToggleFullScreen)
    }

    private _openSidebar = async (anchor: Anchor = null) => {
        await this.props.openSidebar()
        if (anchor) {
            this.props.openCommentBoxWithHighlight(anchor)
        }

        // Highlight any annotations with anchor.
        // (Done here as only in-page sidebar requires to do this.)
        this._highlightAnnotations()
    }

    private _closeSidebarCallback = () => {
        // TODO: Set active annotation to null.

        this.props.removeHighlights()
    }

    private _goToAnnotation = async (annotation: Annotation) => {
        if (!this.props.isSidebarOpen) {
            await this.props.openSidebar()
        }

        // TODO: Set active annotation.

        setTimeout(() => {
            this.props.highlightAndScroll(annotation)
            this._focusOnAnnotation(annotation.url)
        }, 200)
    }

    private _highlightAnnotations = () => {
        const annotations = this.props.annotations.filter(
            annotation => !!annotation.selector,
        )
        this.props.highlightAll(
            annotations,
            this._focusOnAnnotation,
            this._hoverAnnotation,
        )
    }

    private _focusOnAnnotation = (url: string) => {
        // TODO: Set annotation as active.

        if (!url) {
            return
        }

        this._ensureAnnotationIsVisible(url)
    }

    private _hoverAnnotation = (url: string) => {
        console.log(url)
    }

    private _ensureAnnotationIsVisible = (url: string) => {
        const containerNode: Node = ReactDOM.findDOMNode(this._sidebarRef)

        // Find the root node as it may/may not be a shadow DOM.
        // 'any' prevents compilation error.
        const rootNode: Node = (containerNode as any).getRootNode()
        const annotationBoxNode = (rootNode as Document).getElementById(url)
        if (!annotationBoxNode) {
            return
        }

        this._scrollIntoViewIfNeeded(annotationBoxNode)
    }

    private _scrollIntoViewIfNeeded = (annotationBoxNode: Element) => {
        retryUntilErrorResolves(
            () => {
                annotationBoxNode.scrollIntoView({
                    block: 'center',
                    behavior: 'smooth',
                })
            },
            {
                intervalMilliSeconds: 200,
                timeoutMilliSeconds: 2000,
            },
        )
    }

    private _setSidebarRef = (ref: React.Component) => {
        this._sidebarRef = ref
    }

    render() {
        const {
            annotationsManager,
            handleRemoveRibbon,
            isPageFullScreen,
            isSidebarOpen,
        } = this.props

        return (
            <React.Fragment>
                {!isSidebarOpen &&
                    !isPageFullScreen && (
                        <RibbonContainer
                            handleRemoveRibbon={handleRemoveRibbon}
                            openSidebar={this._openSidebar}
                        />
                    )}
                <SidebarContainer
                    env="inpage"
                    annotationsManager={annotationsManager}
                    ref={this._setSidebarRef}
                    goToAnnotation={this._goToAnnotation}
                    closeSidebarCallback={this._closeSidebarCallback}
                />
            </React.Fragment>
        )
    }
}

const mapStateToProps: MapStateToProps<
    StateProps,
    OwnProps,
    RootState
> = state => ({
    isPageFullScreen: ribbonSelectors.isPageFullScreen(state),
    isSidebarOpen: sidebarSelectors.isOpen(state),
    annotations: sidebarSelectors.annotations(state),
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps
> = dispatch => ({
    handleToggleFullScreen: e => {
        e.stopPropagation()
        dispatch(ribbonActions.toggleFullScreen())
    },
    openSidebar: () => {
        dispatch(ribbonActions.setIsExpanded(false))
        dispatch(sidebarActions.openSidebar())
    },
    openCommentBoxWithHighlight: anchor =>
        dispatch(commentBoxActions.openCommentBoxWithHighlight(anchor)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(RibbonSidebarContainer)
