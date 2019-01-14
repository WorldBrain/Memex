import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import onClickOutside from 'react-onclickoutside'

import * as actions from './actions'
import * as selectors from './selectors'
import {
    actions as commentBoxActions,
    selectors as commentBoxSelectors,
} from './comment-box'
import { Sidebar } from './components'
import SidebarState, { MapDispatchToProps, Annotation } from './types'
import AnnotationsManager from './annotations-manager'

interface StateProps {
    isOpen: boolean
    isLoading: boolean
    annotations: Annotation[]
    showCommentBox: boolean
    showCongratsMessage: boolean
}

interface DispatchProps {
    onInit: () => void
    setAnnotationsManager: (annotationsManager: AnnotationsManager) => void
    closeSidebar: () => void
    handleAddCommentBtnClick: () => void
}

interface OwnProps {
    env: 'inpage' | 'overview'
    annotationsManager: AnnotationsManager
    goToAnnotation: (annotation: Annotation) => void
}

type Props = StateProps & DispatchProps & OwnProps

interface State {
    isMouseInsideSidebar: boolean
}

class SidebarContainer extends React.Component<Props, State> {
    state: State = {
        isMouseInsideSidebar: false,
    }

    componentDidMount() {
        this.props.onInit()
        this.props.setAnnotationsManager(this.props.annotationsManager)
    }

    /**
     * Method used by `react-onclickoutside` to detect outside clicks.
     */
    handleClickOutside = (e: Event) => {
        e.stopPropagation()

        const { isOpen, closeSidebar } = this.props
        const { isMouseInsideSidebar } = this.state

        // Only close the sidebar when all of the following conditions are met:
        // 1. Sidebar is open.
        // 2. Mouse is not inside the sidebar.
        // 3. Click did not occur on an annotation highlight.
        // This step is necessary as `onClickOutside` fires for a variety of events.
        if (
            isOpen &&
            !isMouseInsideSidebar &&
            !(e.target as any).dataset.annotation
        ) {
            closeSidebar()
        }
    }

    private _handleMouseEnter = (e: Event) => {
        e.stopPropagation()
        this.setState({ isMouseInsideSidebar: true })
    }

    private _handleMouseLeave = (e: Event) => {
        e.stopPropagation()
        this.setState({ isMouseInsideSidebar: false })
    }

    render() {
        const {
            env,
            isOpen,
            isLoading,
            annotations,
            closeSidebar,
            handleAddCommentBtnClick,
            showCommentBox,
            showCongratsMessage,
            goToAnnotation,
        } = this.props

        return (
            <Sidebar
                env={env}
                isOpen={isOpen}
                isLoading={isLoading}
                annotations={annotations}
                showCommentBox={showCommentBox}
                showCongratsMessage={showCongratsMessage && !isLoading}
                handleAddCommentBtnClick={handleAddCommentBtnClick}
                closeSidebar={closeSidebar}
                goToAnnotation={goToAnnotation}
                handleMouseEnter={this._handleMouseEnter}
                handleMouseLeave={this._handleMouseLeave}
            />
        )
    }
}

const mapStateToProps: MapStateToProps<
    StateProps,
    OwnProps,
    SidebarState
> = state => ({
    isOpen: selectors.isOpen(state),
    isLoading: selectors.isLoading(state),
    annotations: selectors.annotations(state),
    showCommentBox: commentBoxSelectors.showCommentBox(state),
    showCongratsMessage: selectors.showCongratsMessage(state),
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps
> = dispatch => ({
    onInit: () => dispatch(actions.initState()),
    setAnnotationsManager: annotationsManager =>
        dispatch(actions.setAnnotationsManager(annotationsManager)),
    closeSidebar: () => dispatch(actions.closeSidebar()),
    handleAddCommentBtnClick: () =>
        dispatch(commentBoxActions.setShowCommentBox(true)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(onClickOutside(SidebarContainer))
