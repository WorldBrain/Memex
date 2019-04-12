import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { connect, MapStateToProps } from 'react-redux'

import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import * as actions from '../actions'
import RootState, { MapDispatchToProps, OpenSidebarArgs } from '../types'
import RibbonContainer, {
    actions as ribbonActions,
    selectors as ribbonSelectors,
} from '../ribbon'
import SidebarContainer, {
    actions as sidebarActions,
    selectors as sidebarSelectors,
} from 'src/sidebar-common'
import { Annotation } from 'src/sidebar-common/sidebar/types'
import { actions as commentBoxActions } from 'src/sidebar-common/comment-box'
import AnnotationsManager from 'src/sidebar-common/annotations-manager'
import { Anchor } from 'src/direct-linking/content_script/interactions'
import { retryUntilErrorResolves } from '../utils'
import { selectors as commentBoxselectors } from '../../sidebar-common/comment-box'

interface StateProps {
    isPageFullScreen: boolean
    isRibbonEnabled: boolean
    isSidebarOpen: boolean
    isCommentSaved: boolean
    commentText: string
    annotations: Annotation[]
}

interface DispatchProps {
    onInit: () => void
    handleToggleFullScreen: (e: Event) => void
    openSidebar: (args: OpenSidebarArgs) => void
    closeSidebar: () => void
    openCommentBoxWithHighlight: (anchor: Anchor) => void
    setRibbonEnabled: (isRibbonEnabled: boolean) => void
    setTooltipEnabled: (isTooltipEnabled: boolean) => void
    setActiveAnnotationUrl: (url: string) => void
    setHoverAnnotationUrl: (url: string) => void
    setShowCommentBox: () => void
}

interface OwnProps {
    annotationsManager: AnnotationsManager
    handleRemoveRibbon: () => void
    insertOrRemoveTooltip: (isTooltipEnabled: boolean) => void
    highlightAll: (
        highlights: Annotation[],
        openSidebar: (args: OpenSidebarArgs) => void,
        focusOnAnnotation: (url: string) => void,
        hoverAnnotationContainer: (url: string) => void,
    ) => void
    highlightAndScroll: (annotation: Annotation) => number
    removeHighlights: () => void
    makeHighlightMedium: (annotation: Annotation) => void
    removeMediumHighlights: () => void
    sortAnnotationsByPosition: (annotations: Annotation[]) => Annotation[]
}

type Props = StateProps & DispatchProps & OwnProps

interface State {
    isMouseInRibbonSideSidebar: boolean
}

class RibbonSidebarContainer extends React.Component<Props, State> {
    private ribbonSidebarRef: HTMLDivElement = null

    private setRibbonSidebarRef = (ref: HTMLDivElement) => {
        this.ribbonSidebarRef = ref
    }

    state: State = {
        isMouseInRibbonSideSidebar: false,
    }

    componentDidMount() {
        this.props.onInit()
        this._setupFullScreenListener()
        this._setupRPC()
        this.attachEventListeners()
    }

    componentWillUnmount() {
        this._removeFullScreenListener()
        this.removeEventListeners()
    }

    componentDidUpdate(prevProps: Props) {
        const { annotations, isSidebarOpen } = this.props
        if (prevProps.annotations !== annotations && isSidebarOpen) {
            this.props.removeHighlights()
            this._highlightAnnotations()
        }
    }

    public updateRibbonState = ({
        isRibbonEnabled,
        isTooltipEnabled,
    }: {
        isRibbonEnabled: boolean
        isTooltipEnabled: boolean
    }) => {
        this.props.setRibbonEnabled(isRibbonEnabled)
        this.props.setTooltipEnabled(isTooltipEnabled)
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

    private attachEventListeners() {
        document.addEventListener('click', this.handleOutsideClick, false)
        document.addEventListener('keydown', this.onKeydown, false)

        this.ribbonSidebarRef.addEventListener(
            'mouseenter',
            this.handleMouseEnter,
        )
        this.ribbonSidebarRef.addEventListener(
            'mouseleave',
            this.handleMouseLeave,
        )
    }

    private removeEventListeners() {
        document.removeEventListener('click', this.handleOutsideClick, false)
        document.removeEventListener('keydown', this.onKeydown, false)

        this.ribbonSidebarRef.removeEventListener(
            'mouseenter',
            this.handleMouseEnter,
        )
        this.ribbonSidebarRef.removeEventListener(
            'mouseleave',
            this.handleMouseLeave,
        )
    }

    private handleMouseEnter = (e: Event) => {
        e.stopPropagation()
        this.setState({ isMouseInRibbonSideSidebar: true })
    }

    private handleMouseLeave = (e: Event) => {
        e.stopPropagation()
        this.setState({ isMouseInRibbonSideSidebar: false })
    }

    private handleOutsideClick: EventListener = e => {
        e.stopPropagation()

        // Only close the sidebar when all of the following conditions are met:
        // 1. Sidebar is open.
        // 2. Mouse is not inside the sidebar.
        // 3. Click did not occur on an annotation highlight.
        // This step is necessary as `onClickOutside` fires for a variety of events.
        if (
            this.props.isSidebarOpen &&
            !this.state.isMouseInRibbonSideSidebar &&
            !(e.target as any).dataset.annotation
        ) {
            this.props.closeSidebar()
            this._closeSidebarCallback()
        }
    }

    private onKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && this.props.isSidebarOpen) {
            this.props.closeSidebar()
            this._closeSidebarCallback()
        }
    }

    private _openSidebar = async ({
        anchor = null,
        activeUrl,
        openToTags,
        openToComment,
        openToCollections,
    }: OpenSidebarArgs & { anchor: Anchor }) => {
        await this.props.openSidebar({
            activeUrl,
            openToTags,
            openToComment,
            openToCollections,
        })

        if (anchor) {
            this.props.openCommentBoxWithHighlight(anchor)
        }

        if (activeUrl) {
            this._focusOnAnnotation(activeUrl)
        }

        // Highlight any annotations with anchor.
        // (Done here as only in-page sidebar requires to do this.)
        await this._highlightAnnotations()
    }

    private _closeSidebarCallback = () => {
        this.props.setActiveAnnotationUrl(null)
        this.props.setHoverAnnotationUrl(null)
        this.props.removeHighlights()
    }

    private _goToAnnotation = async (annotation: Annotation) => {
        if (!this.props.isSidebarOpen) {
            setTimeout(async () => {
                await this.props.openSidebar({ activeUrl: annotation.url })
                setTimeout(() => {
                    this.props.highlightAndScroll(annotation)
                    this._focusOnAnnotation(annotation.url)
                }, 1500)
            }, 2000)
        } else {
            setTimeout(() => {
                this.props.highlightAndScroll(annotation)
                this._focusOnAnnotation(annotation.url)
            }, 200)
        }
    }

    private _highlightAnnotations = async () => {
        const annotations = this.props.annotations.filter(
            annotation => !!annotation.selector,
        )
        await this.props.highlightAll(
            annotations,
            this.props.openSidebar,
            this._focusOnAnnotation,
            this._hoverAnnotation,
        )
    }

    private _focusOnAnnotation = (url: string) => {
        this.props.setActiveAnnotationUrl(url)

        if (!url) {
            return
        }

        this._ensureAnnotationIsVisible(url)
    }

    private _hoverAnnotation = (url: string) => {
        this.props.setHoverAnnotationUrl(url)
    }

    private _ensureAnnotationIsVisible = (url: string) => {
        const containerNode: Node = ReactDOM.findDOMNode(this.ribbonSidebarRef)

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
                    behavior: 'auto',
                })
            },
            {
                intervalMilliSeconds: 200,
                timeoutMilliSeconds: 2000,
            },
        )
    }

    render() {
        const {
            annotationsManager,
            handleRemoveRibbon,
            insertOrRemoveTooltip,
            isPageFullScreen,
            isSidebarOpen,
            isRibbonEnabled,
            makeHighlightMedium,
            removeMediumHighlights,
            sortAnnotationsByPosition,
            closeSidebar,
            isCommentSaved,
            commentText,
            setShowCommentBox,
        } = this.props

        return (
            <div ref={this.setRibbonSidebarRef}>
                {isRibbonEnabled && (
                    <RibbonContainer
                        annotationsManager={annotationsManager}
                        isSidebarOpen={isSidebarOpen}
                        isRibbonEnabled={isRibbonEnabled}
                        handleRemoveRibbon={handleRemoveRibbon}
                        insertOrRemoveTooltip={insertOrRemoveTooltip}
                        openSidebar={this._openSidebar}
                        closeSidebar={closeSidebar}
                        isCommentSaved={isCommentSaved}
                        commentText={commentText}
                        setShowCommentBox={setShowCommentBox}
                    />
                )}

                {isSidebarOpen && (
                    <SidebarContainer
                        env="inpage"
                        annotationsManager={annotationsManager}
                        goToAnnotation={this._goToAnnotation}
                        closeSidebarCallback={this._closeSidebarCallback}
                        handleAnnotationBoxMouseEnter={makeHighlightMedium}
                        handleAnnotationBoxMouseLeave={removeMediumHighlights}
                        sortAnnotationsByPosition={sortAnnotationsByPosition}
                    />
                )}
            </div>
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
    isCommentSaved: commentBoxselectors.isCommentSaved(state),
    commentText: commentBoxselectors.commentText(state),
    annotations: sidebarSelectors.annotations(state),
    isRibbonEnabled: ribbonSelectors.isRibbonEnabled(state),
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps
> = dispatch => ({
    onInit: () => dispatch(actions.initState()),
    handleToggleFullScreen: e => {
        e.stopPropagation()
        dispatch(ribbonActions.toggleFullScreen())
    },
    openSidebar: (args = {}) => {
        dispatch(ribbonActions.setIsExpanded(false))
        return dispatch(sidebarActions.openSidebar(args))
    },
    closeSidebar: () => dispatch(sidebarActions.closeSidebar()),
    openCommentBoxWithHighlight: anchor =>
        dispatch(commentBoxActions.openCommentBoxWithHighlight(anchor)),
    setRibbonEnabled: isRibbonEnabled =>
        dispatch(ribbonActions.setRibbonEnabled(isRibbonEnabled)),
    setTooltipEnabled: isTooltipEnabled =>
        dispatch(ribbonActions.setTooltipEnabled(isTooltipEnabled)),
    setActiveAnnotationUrl: url =>
        dispatch(sidebarActions.setActiveAnnotationUrl(url)),
    setHoverAnnotationUrl: url =>
        dispatch(sidebarActions.setHoverAnnotationUrl(url)),
    setShowCommentBox: () =>
        dispatch(commentBoxActions.setShowCommentBox(true)),
})

export default connect<StateProps, DispatchProps, OwnProps>(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true },
)(RibbonSidebarContainer)
