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
import { highlightAndScroll } from '../sidebar-overlay/content_script/highlight-interactions'
import { goToAnnotation } from './utils'

interface StateProps {
    isOpen: boolean
    isLoading: boolean
    pageUrl: string
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
}

type Props = StateProps & DispatchProps & OwnProps

interface State {
    isMouseInsideSidebar: boolean
}

class SidebarContainer extends React.Component<Props, State> {
    private _goToAnnotation: (annotation: Annotation) => void

    state: State = {
        isMouseInsideSidebar: false,
    }

    componentDidMount() {
        this.props.onInit()
        this.props.setAnnotationsManager(this.props.annotationsManager)

        this._setGoToAnnotation()
    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.pageUrl !== this.props.pageUrl) {
            this._setGoToAnnotation()
        }
    }

    /**
     * Method used by `react-onclickoutside` to detect outside clicks.
     */
    handleClickOutside = (e: Event) => {
        e.stopPropagation()

        const { isOpen, closeSidebar } = this.props
        const { isMouseInsideSidebar } = this.state

        // Only close the sidebar if the sidebar is open and if the mouse is not inside it.
        // This step is necessary as `onClickOutside` fires for a variety of events.
        if (isOpen && !isMouseInsideSidebar) {
            closeSidebar()
        }
    }

    private _setGoToAnnotation = () => {
        const { env, pageUrl } = this.props
        const callback = (annotation: Annotation) => {
            // TODO: Set active annotation.

            // TODO: Do not use `highlightAndScroll` directly here. Instead,
            // take it from `props` iff `env` is `inpage`.
            highlightAndScroll(annotation)
        }

        this._goToAnnotation = goToAnnotation(env, pageUrl, callback)
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
                goToAnnotation={this._goToAnnotation}
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
    pageUrl: selectors.pageUrl(state),
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
