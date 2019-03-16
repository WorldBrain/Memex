import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import * as actions from '../actions'
import * as selectors from '../selectors'
import {
    actions as commentBoxActions,
    selectors as commentBoxSelectors,
} from '../../comment-box'
import Sidebar from './sidebar'
import SidebarState, { Annotation } from '../types'
import RootState, { MapDispatchToProps } from '../../types'
import AnnotationsManager from '../../annotations-manager'

interface StateProps {
    isOpen: boolean
    isLoading: boolean
    needsWaypoint: boolean
    appendLoader: boolean
    annotations: Annotation[]
    activeAnnotationUrl: string
    hoverAnnotationUrl: string
    showCommentBox: boolean
    showCongratsMessage: boolean
}

interface DispatchProps {
    onInit: () => void
    setAnnotationsManager: (annotationsManager: AnnotationsManager) => void
    closeSidebar: () => void
    handleAddCommentBtnClick: () => void
    setHoverAnnotationUrl: (url: string) => void
    handleEditAnnotation: (url: string, comment: string, tags: string[]) => void
    handleDeleteAnnotation: (url: string) => void
    handleScrollPagination: () => void
    handleBookmarkToggle: (url: string) => void
}

interface OwnProps {
    env: 'inpage' | 'overview'
    annotationsManager: AnnotationsManager
    sortAnnotationsByPosition?: (annotations: Annotation[]) => Annotation[]
    goToAnnotation: (annotation: Annotation) => void
    /** Optional callback function that gets called after the sidebar is closed. */
    closeSidebarCallback?: () => void
    /** Optional callback function that gets called when the mouse enters an annotation box area. */
    handleAnnotationBoxMouseEnter?: (annotation: Annotation) => void
    /** Optional callback function that gets called when the mouse leaves the annotation box area. */
    handleAnnotationBoxMouseLeave?: () => void
}

type Props = StateProps & DispatchProps & OwnProps

class SidebarContainer extends React.Component<Props> {
    componentDidMount() {
        this.props.onInit()
        this.props.setAnnotationsManager(this.props.annotationsManager)
        document.addEventListener('keydown', this.onKeydown, false)
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.onKeydown, false)
    }

    private onKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && this.props.isOpen) {
            this._closeSidebar()
        }
    }

    private _closeSidebar = () => {
        this.props.closeSidebar()
        if (this.props.closeSidebarCallback) {
            this.props.closeSidebarCallback()
        }
    }

    private _handleGoToAnnotation = (annotation: Annotation) => (
        e: React.MouseEvent<HTMLElement>,
    ) => {
        e.preventDefault()
        e.stopPropagation()
        this.props.goToAnnotation(annotation)
    }

    private _handleAnnotationBoxMouseEnter = (annotation: Annotation) => (
        e: Event,
    ) => {
        e.stopPropagation()
        this.props.setHoverAnnotationUrl(annotation.url)
        if (this.props.handleAnnotationBoxMouseEnter) {
            this.props.handleAnnotationBoxMouseEnter(annotation)
        }
    }

    private _handleAnnotationBoxMouseLeave = () => (e: Event) => {
        e.stopPropagation()
        this.props.setHoverAnnotationUrl(null)
        if (this.props.handleAnnotationBoxMouseLeave) {
            this.props.handleAnnotationBoxMouseLeave()
        }
    }

    render() {
        const {
            env,
            isOpen,
            isLoading,
            annotations,
            activeAnnotationUrl,
            hoverAnnotationUrl,
            handleAddCommentBtnClick,
            showCommentBox,
            showCongratsMessage,
        } = this.props

        return (
            <Sidebar
                env={env}
                isOpen={isOpen}
                isLoading={isLoading}
                annotations={annotations}
                activeAnnotationUrl={activeAnnotationUrl}
                hoverAnnotationUrl={hoverAnnotationUrl}
                showCommentBox={showCommentBox}
                showCongratsMessage={showCongratsMessage && !isLoading}
                handleAddCommentBtnClick={handleAddCommentBtnClick}
                closeSidebar={this._closeSidebar}
                handleGoToAnnotation={this._handleGoToAnnotation}
                handleAnnotationBoxMouseEnter={
                    this._handleAnnotationBoxMouseEnter
                }
                handleAnnotationBoxMouseLeave={
                    this._handleAnnotationBoxMouseLeave
                }
                handleEditAnnotation={this.props.handleEditAnnotation}
                handleDeleteAnnotation={this.props.handleDeleteAnnotation}
                handleScrollPagination={this.props.handleScrollPagination}
                appendLoader={this.props.appendLoader}
                handleBookmarkToggle={this.props.handleBookmarkToggle}
            />
        )
    }
}

const mapStateToProps: MapStateToProps<
    StateProps,
    OwnProps,
    RootState
> = state => ({
    isOpen: selectors.isOpen(state),
    isLoading: selectors.isLoading(state),
    // Disable pagination for now
    // needsWaypoint: selectors.needsPagWaypoint(state),
    needsWaypoint: false,
    appendLoader: selectors.shouldAppendLoader(state),
    annotations: selectors.annotations(state),
    activeAnnotationUrl: selectors.activeAnnotationUrl(state),
    hoverAnnotationUrl: selectors.hoverAnnotationUrl(state),
    showCommentBox: commentBoxSelectors.showCommentBox(state),
    showCongratsMessage: selectors.showCongratsMessage(state),
})

const mapDispatchToProps: MapDispatchToProps<DispatchProps, OwnProps> = (
    dispatch,
    props,
) => ({
    onInit: () => dispatch(actions.initState()),
    setAnnotationsManager: annotationsManager =>
        dispatch(actions.setAnnotationsManager(annotationsManager)),
    closeSidebar: () => {
        // This state is not used in the content script version of sidebar
        //  statically importing causes big issues
        if (props.env === 'overview') {
            const {
                resetActiveSidebarIndex,
            } = require('src/overview/results/actions')
            dispatch(resetActiveSidebarIndex())
        }

        dispatch(actions.closeSidebar())
    },
    handleAddCommentBtnClick: () =>
        dispatch(commentBoxActions.setShowCommentBox(true)),
    setHoverAnnotationUrl: url => dispatch(actions.setHoverAnnotationUrl(url)),
    handleEditAnnotation: (url, comment, tags) =>
        dispatch(actions.editAnnotation(url, comment, tags)),
    handleDeleteAnnotation: url => dispatch(actions.deleteAnnotation(url)),
    handleScrollPagination: () => dispatch(actions.fetchMoreAnnotations()),
    handleBookmarkToggle: url => dispatch(actions.toggleBookmark(url)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(SidebarContainer)
