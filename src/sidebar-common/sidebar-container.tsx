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
}

interface DispatchProps {
    onInit: () => void
    setAnnotationsManager: (annotationsManager: AnnotationsManager) => void
    closeSidebar: () => void
    fetchAnnotations: () => void
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
    // static propTypes = {
    //     recieveAnchor: PropTypes.func.isRequired,
    // }

    state = {
        isMouseInsideSidebar: false,
    }

    componentDidMount() {
        const { onInit, setAnnotationsManager, annotationsManager } = this.props
        onInit()
        setAnnotationsManager(annotationsManager)
    }

    componentDidUpdate(prevProps: Props) {
        if (!prevProps.isOpen && this.props.isOpen) {
            this.props.fetchAnnotations()
        }
    }

    // parentFC = new FrameCommunication()

    // setupFrameFunctions = () => {
    //     this.parentFC.setUpRemoteFunctions({
    //         focusCommentBox: value => {
    //             this.props.focusCommentBox(value)
    //         },
    //         setAnnotations: annotations => {
    //             this.props.setAnnotationAndTags(annotations)
    //         },
    //         sendAnchorToSidebar: anchor => {
    //             this.props.recieveAnchor(anchor)
    //         },
    //         focusAnnotation: url => {
    //             this.focusAnnotation(url)
    //         },
    //         setHoveredAnnotation: url => {
    //             this.props.setHoveredAnnotation(url)
    //         },
    //         setLoaderActive: () => {
    //             this.props.setIsLoading(true)
    //         },
    //     })
    // }

    // /**
    //  * Takes the user to the actual higlighted text.
    //  */
    // goToAnnotation = () => {
    //     return goToAnnotation(
    //         this.props.env,
    //         this.props.pageUrl,
    //         annotation => {
    //             this.props.setActiveAnnotation(annotation.url)
    //             this.parentFC.remoteExecute('highlightAndScroll')(annotation)
    //         },
    //     )
    // }

    // /**
    //  * Sets the annotation container active
    //  */
    // focusAnnotation = url => {
    //     this.props.setActiveAnnotation(url)
    //     if (!url) {
    //         return
    //     }
    //     retryUntilErrorResolves(
    //         () => {
    //             const $container = document.getElementById(url)
    //             $container.scrollIntoView({
    //                 block: 'center',
    //                 behavior: 'smooth',
    //             })
    //         },
    //         { intervalMiliseconds: 200, timeoutMiliseconds: 2000 },
    //     )
    // }

    // updateAnnotations = async () => {
    //     await this.parentFC.remoteExecute('updateAnnotations')()
    //     setTimeout(() => this.focusAnnotation(this.props.activeAnnotation), 300)
    // }

    // /**
    //  * Makes highlight dark a little when the container is hovered
    //  */
    // makeHighlightMedium = annotation => () => {
    //     if (this.props.env === 'overview') {
    //         return
    //     }
    //     this.parentFC.remoteExecute('makeHighlightMedium')(annotation)
    // }

    // /**
    //  * Removes all medium highlights
    //  */
    // removeMediumHighlights = () => {
    //     if (this.props.env === 'overview') {
    //         return
    //     }
    //     this.parentFC.remoteExecute('removeMediumHighlights')()
    // }

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

    handleMouseEnter = (e: Event) => {
        e.stopPropagation()
        this.setState({ isMouseInsideSidebar: true })
    }

    handleMouseLeave = (e: Event) => {
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
        } = this.props

        return (
            <Sidebar
                env={env}
                isOpen={isOpen}
                isLoading={isLoading}
                annotations={annotations}
                showCommentBox={showCommentBox}
                handleAddCommentBtnClick={handleAddCommentBtnClick}
                closeSidebar={closeSidebar}
                handleMouseEnter={this.handleMouseEnter}
                handleMouseLeave={this.handleMouseLeave}
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
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps
> = dispatch => ({
    onInit: () => dispatch(actions.initState()),
    setAnnotationsManager: annotationsManager =>
        dispatch(actions.setAnnotationsManager(annotationsManager)),
    closeSidebar: () => dispatch(actions.setSidebarOpen(false)),
    fetchAnnotations: () => dispatch(actions.fetchAnnotations()),
    handleAddCommentBtnClick: () =>
        dispatch(commentBoxActions.setShowCommentBox(true)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(onClickOutside(SidebarContainer))
