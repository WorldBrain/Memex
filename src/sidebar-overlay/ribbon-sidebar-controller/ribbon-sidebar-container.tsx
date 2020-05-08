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
} from 'src/sidebar-overlay/sidebar'
import { KeyboardActions } from 'src/sidebar-overlay/sidebar/types'
import {
    actions as commentBoxActions,
    selectors as commentBoxselectors,
} from 'src/sidebar-overlay/comment-box'
import AnnotationsManager from 'src/annotations/annotations-manager'
import * as bookmarkActs from 'src/popup/bookmark-button/actions'
import * as popup from 'src/popup/selectors'
import { retryUntilErrorResolves } from 'src/util/retry-until'
import { Anchor, HighlightInteractionInterface } from 'src/highlighting/types'
import { Annotation } from 'src/annotations/types'
import { withSidebarContext } from 'src/sidebar-overlay/ribbon-sidebar-controller/sidebar-context'
import analytics from 'src/analytics'

interface StateProps {
    url: string
    isPageFullScreen: boolean
    isRibbonEnabled: boolean
    isSidebarOpen: boolean
    isCommentSaved: boolean
    isFilterOpen: boolean
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
    setShowSidebarCommentBox: () => void
    openRibbon: () => void
    closeRibbon: () => void
    setShowCommentBox: (value: boolean) => void
    setShowTagsPicker: (value: boolean) => void
    setShowCollectionsPicker: (value: boolean) => void
    toggleBookmark: () => void
}

interface OwnProps extends Partial<KeyboardActions> {
    closeTimeoutMs?: number
    forceExpand?: boolean
    annotationsManager: AnnotationsManager
    getUrl?: () => string
    handleRemoveRibbon: () => void
    insertOrRemoveTooltip: (isTooltipEnabled: boolean) => void
    highlighter: HighlightInteractionInterface
}

type Props = StateProps & DispatchProps & OwnProps

interface State {
    isMouseInRibbonSideSidebar: boolean
}

class RibbonSidebarContainer extends React.Component<Props, State> {
    static defaultProps = {
        closeTimeoutMs: 1000,
    }

    private containerRef: HTMLDivElement
    private ribbonRef: HTMLElement
    private mouseInsideRibbon: boolean
    private timeoutId

    private setContainerRef = (ref: HTMLDivElement) => {
        this.containerRef = ref
    }

    private setRibbonRef = (ref: HTMLElement) => {
        this.ribbonRef = ref
    }

    state: State = {
        isMouseInRibbonSideSidebar: false,
    }

    componentDidMount() {
        this._setupRPC()
        this.addEventListeners()
        const initAndHandle = async () => {
            await this.props.onInit()
            await this.handleKeyboardActions(this.props, this.props.forceExpand)
        }
        initAndHandle()
    }

    componentWillUnmount() {
        this.removeEventListeners()
    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.url !== this.getUrl()) {
            this.props.onInit()
        }
    }

    private getUrl = () => location.href

    public updateRibbonState = ({
        isRibbonEnabled,
        isTooltipEnabled,
        openRibbon,
        ...keyboardActions
    }: {
        isRibbonEnabled: boolean
        isTooltipEnabled: boolean
        openRibbon: boolean
    } & Partial<KeyboardActions>) => {
        this.props.setRibbonEnabled(isRibbonEnabled)
        this.props.setTooltipEnabled(isTooltipEnabled)

        this.handleKeyboardActions(keyboardActions, openRibbon)
    }

    private handleKeyboardActions(
        {
            openToCollections,
            openToBookmark,
            openToComment,
            openToTags,
        }: Partial<KeyboardActions>,
        openRibbon: boolean,
    ) {
        if (!openRibbon) {
            return
        }

        this.props.setRibbonEnabled(true)
        this.props.openRibbon()
        this.resetTimeout()

        if (openToCollections) {
            this.props.setShowCollectionsPicker(true)
        }

        if (openToTags) {
            this.props.setShowTagsPicker(true)
        }

        if (openToComment) {
            this.props.setShowCommentBox(true)
        }

        if (openToBookmark) {
            this.props.toggleBookmark()
            this.closeRibbonAfterTimeout()
        }
    }

    private _setupRPC = () => {
        makeRemotelyCallable({
            openSidebar: this._openSidebar,
            goToAnnotation: this._goToAnnotation,
        })
    }

    private addEventListeners() {
        document.addEventListener(
            'fullscreenchange',
            this.props.handleToggleFullScreen,
        )
        document.addEventListener('click', this.handleOutsideClick, false)
        document.addEventListener('keydown', this.onKeydown, false)
        document.addEventListener('click', this.handleClick)
        document.addEventListener('keydown', this.handleKeyDown)

        this.ribbonRef.addEventListener(
            'mouseenter',
            this.handleRibbonMouseEnter,
        )
        this.ribbonRef.addEventListener(
            'mouseleave',
            this.handleRibbonMouseLeave,
        )

        this.containerRef.addEventListener('mouseenter', this.handleMouseEnter)
        this.containerRef.addEventListener('mouseleave', this.handleMouseLeave)
    }

    private removeEventListeners() {
        document.removeEventListener(
            'fullscreenchange',
            this.props.handleToggleFullScreen,
        )
        document.removeEventListener('click', this.handleOutsideClick, false)
        document.removeEventListener('keydown', this.onKeydown, false)
        document.removeEventListener('click', this.handleClick)
        document.removeEventListener('keydown', this.handleKeyDown)

        this.ribbonRef.removeEventListener(
            'mouseenter',
            this.handleRibbonMouseEnter,
        )
        this.ribbonRef.removeEventListener(
            'mouseleave',
            this.handleRibbonMouseLeave,
        )

        this.containerRef.removeEventListener(
            'mouseenter',
            this.handleMouseEnter,
        )
        this.containerRef.removeEventListener(
            'mouseleave',
            this.handleMouseLeave,
        )
    }

    private handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            this.handleRibbonClose()
        }
    }

    private handleClick = (e: MouseEvent) => {
        if (!this.mouseInsideRibbon) {
            this.handleRibbonClose()
        }
    }

    private handleRibbonClose = () => {
        this.props.setShowCollectionsPicker(false)
        this.props.setShowTagsPicker(false)
        this.props.setShowCommentBox(false)
        this.props.closeRibbon()
    }

    private closeRibbonAfterTimeout() {
        if (this.props.isFilterOpen) {
            return
        }
        this.timeoutId = setTimeout(
            this.handleRibbonClose,
            this.props.closeTimeoutMs,
        )
    }

    private resetTimeout = () => clearTimeout(this.timeoutId)

    private handleRibbonMouseEnter = () => {
        this.mouseInsideRibbon = true

        this.resetTimeout()
        this.props.openRibbon()
    }

    private handleRibbonMouseLeave = () => {
        this.mouseInsideRibbon = false

        if (this.props.commentText.length === 0) {
            this.closeRibbonAfterTimeout()
        }
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
    }: OpenSidebarArgs & { anchor: Anchor }) => {
        analytics.trackEvent({
            category: 'Sidebar',
            action: 'showSidebar',
        })

        await this.props.openSidebar({ activeUrl })

        if (anchor) {
            this.props.openCommentBoxWithHighlight(anchor)
        }

        if (activeUrl) {
            this._focusOnAnnotation(activeUrl)
        }
    }

    private _closeSidebarCallback = () => {
        this.props.setActiveAnnotationUrl(null)
        this.props.setHoverAnnotationUrl(null)
        this.props.highlighter.removeTempHighlights()
    }

    private _goToAnnotation = async (annotation: Annotation) => {
        if (!this.props.isSidebarOpen) {
            setTimeout(async () => {
                await this.props.openSidebar({ activeUrl: annotation.url })
                setTimeout(() => {
                    this.props.highlighter.highlightAndScroll(annotation)
                    this._focusOnAnnotation(annotation.url)
                }, 1500)
            }, 2000)
        } else {
            setTimeout(() => {
                this.props.highlighter.highlightAndScroll(annotation)
                this._focusOnAnnotation(annotation.url)
            }, 200)
        }
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
        const containerNode: Node = ReactDOM.findDOMNode(this.containerRef)

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
            closeSidebar,
            isCommentSaved,
            commentText,
            setShowSidebarCommentBox,
        } = this.props

        return (
            <div ref={this.setContainerRef}>
                {isRibbonEnabled && (
                    <RibbonContainer
                        setRibbonRef={this.setRibbonRef}
                        annotationsManager={annotationsManager}
                        isSidebarOpen={isSidebarOpen}
                        isRibbonEnabled={isRibbonEnabled}
                        handleRemoveRibbon={handleRemoveRibbon}
                        insertOrRemoveTooltip={insertOrRemoveTooltip}
                        openSidebar={this._openSidebar}
                        closeSidebar={closeSidebar}
                        isCommentSaved={isCommentSaved}
                        commentText={commentText}
                        setShowSidebarCommentBox={setShowSidebarCommentBox}
                        getUrl={this.getUrl}
                    />
                )}

                {isSidebarOpen && (
                    <SidebarContainer
                        env="inpage"
                        annotationsManager={annotationsManager}
                        goToAnnotation={this._goToAnnotation}
                        closeSidebarCallback={this._closeSidebarCallback}
                    />
                )}
            </div>
        )
    }
}
// TODO: Upgrade to React 16.6
// RibbonSidebarContainer.contextType = SidebarContext;

const mapStateToProps: MapStateToProps<
    StateProps,
    OwnProps,
    RootState
> = state => ({
    url: popup.url(state),
    isPageFullScreen: ribbonSelectors.isPageFullScreen(state),
    isSidebarOpen: sidebarSelectors.isOpen(state),
    isCommentSaved: commentBoxselectors.isCommentSaved(state),
    commentText: commentBoxselectors.commentText(state),
    annotations: sidebarSelectors.annotations(state),
    isRibbonEnabled: ribbonSelectors.isRibbonEnabled(state),
    isFilterOpen: ribbonSelectors.isFilterOpen(state),
})

const mapDispatchToProps: MapDispatchToProps<DispatchProps, OwnProps> = (
    dispatch,
    props,
) => ({
    onInit: () => {
        if (props.forceExpand) {
            dispatch(ribbonActions.setIsExpanded(true))
        }

        dispatch(actions.initState())
    },
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
    setShowCommentBox: (value: boolean) =>
        dispatch(ribbonActions.setShowCommentBox(value)),
    setShowTagsPicker: (value: boolean) =>
        dispatch(ribbonActions.setShowTagsPicker(value)),
    setShowCollectionsPicker: (value: boolean) =>
        dispatch(ribbonActions.setShowCollsPicker(value)),
    setActiveAnnotationUrl: url =>
        dispatch(sidebarActions.setActiveAnnotationUrl(url)),
    setHoverAnnotationUrl: url =>
        dispatch(sidebarActions.setHoverAnnotationUrl(url)),
    setShowSidebarCommentBox: () =>
        dispatch(commentBoxActions.setShowCommentBox(true)),
    openRibbon: () => dispatch(ribbonActions.setIsExpanded(true)),
    closeRibbon: () => dispatch(ribbonActions.setIsExpanded(false)),
    toggleBookmark: () => dispatch(bookmarkActs.toggleBookmark()),
})

export default withSidebarContext(
    connect<StateProps, DispatchProps, OwnProps>(
        mapStateToProps,
        mapDispatchToProps,
        null,
        { withRef: true },
    )(RibbonSidebarContainer),
)
