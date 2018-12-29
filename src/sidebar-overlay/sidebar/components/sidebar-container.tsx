import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import onClickOutside from 'react-onclickoutside'

// import { actions as commentActions } from '../../comment-box'
import * as actions from '../actions'
import * as selectors from '../selectors'
import {
    actions as commentBoxActions,
    selectors as commentBoxSelectors,
} from '../../comment-box'
import Sidebar from './sidebar'
import { RootState } from '../../ribbon-sidebar-controller'
import { MapDispatchToProps } from '../../types'
// import EmptyMessage from '../empty-message'
// import Annotation from '../annotation'
// import Loader from '../loader'

// import { goToAnnotation, retryUntilErrorResolves } from '../../utils'
// import FrameCommunication from '../../messaging'

interface StateProps {
    isOpen: boolean
    showCommentBox: boolean
}

interface DispatchProps {
    closeSidebar: () => void
    handleAddCommentBtnClick: () => void
}

interface OwnProps {}

type Props = StateProps & DispatchProps & OwnProps

interface State {
    isMouseInsideSidebar: boolean
}

class SidebarContainer extends React.Component<Props, State> {
    // static propTypes = {
    //     showSidebar: PropTypes.bool,
    //     setShowSidebar: PropTypes.func,
    //     toggleMouseOnSidebar: PropTypes.func,
    //     env: PropTypes.string,
    //     pageUrl: PropTypes.string,
    //     pageTitle: PropTypes.string,
    //     annotations: PropTypes.array.isRequired,
    //     tags: PropTypes.object.isRequired,
    //     isLoading: PropTypes.bool.isRequired,
    //     fetchAnnotations: PropTypes.func.isRequired,
    //     setAnnotationAndTags: PropTypes.func.isRequired,
    //     editAnnotation: PropTypes.func.isRequired,
    //     deleteAnnotation: PropTypes.func.isRequired,
    //     recieveAnchor: PropTypes.func.isRequired,
    //     setActiveAnnotation: PropTypes.func.isRequired,
    //     setHoveredAnnotation: PropTypes.func.isRequired,
    //     setAnnotations: PropTypes.func.isRequired,
    //     setHidden: PropTypes.func.isRequired,
    //     setIsLoading: PropTypes.func.isRequired,
    //     focusCommentBox: PropTypes.func.isRequired,
    //     activeAnnotation: PropTypes.string.isRequired,
    //     hoveredAnnotation: PropTypes.string.isRequired,
    // }

    // static defaultProps = {
    //     showSidebar: true,
    //     setShowSidebar: () => null,
    //     toggleMouseOnSidebar: () => null,
    //     env: 'iframe',
    //     pageUrl: null,
    //     pageTitle: null,
    // }

    // async componentDidMount() {
    //     const { pageTitle, pageUrl, setPageInfo, fetchAnnotations } = this.props
    //     setPageInfo(pageUrl, pageTitle)
    //     if (this.props.env === 'iframe') {
    //         this.setupFrameFunctions()
    //     } else {
    //         await fetchAnnotations()
    //     }
    // }

    state = {
        isMouseInsideSidebar: false,
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

    // handleStateChange = ({ isOpen }) => {
    //     if (!isOpen) {
    //         this.props.setShowSidebar(false)
    //         this.props.setAnnotations([])
    //         this.props.setHidden(false)
    //     }
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

    // deleteAnnotation = annotation => {
    //     if (annotation.body) {
    //         this.parentFC.remoteExecute('deleteAnnotation')(annotation)
    //     }
    //     this.props.deleteAnnotation(annotation)
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

    // renderAnnotations = () => {
    //     const { annotations, env, isLoading } = this.props

    //     if (isLoading) {
    //         return <Loader />
    //     }

    //     if (!this.props.isLoading && !this.props.annotations.length) {
    //         return <EmptyMessage />
    //     }

    //     if (env === 'overview') {
    //         annotations.sort((x, y) => x.createdWhen < y.createdWhen)
    //     }

    //     return annotations.map(annotation => (
    //         <Annotation
    //             annotation={annotation}
    //             tags={this.props.tags[annotation.url]}
    //             goToAnnotation={this.goToAnnotation()}
    //             editAnnotation={this.props.editAnnotation}
    //             deleteAnnotation={this.deleteAnnotation}
    //             key={annotation.url}
    //             env={this.props.env}
    //             onMouseEnter={this.makeHighlightMedium}
    //             onMouseLeave={this.removeMediumHighlights}
    //             isActive={this.props.activeAnnotation === annotation.url}
    //             isHovered={this.props.hoveredAnnotation === annotation.url}
    //         />
    //     ))
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
            isOpen,
            closeSidebar,
            handleAddCommentBtnClick,
            showCommentBox,
        } = this.props

        return (
            <Sidebar
                isOpen={isOpen}
                showCommentBox={showCommentBox}
                handleAddCommentBtnClick={handleAddCommentBtnClick}
                closeSidebar={closeSidebar}
                handleMouseEnter={this.handleMouseEnter}
                handleMouseLeave={this.handleMouseLeave}
            />
        )
    }
}

// const mapStateToProps = state => ({
//     annotations: selectors.annotations(state),
//     tags: selectors.tags(state),
//     activeAnnotation: selectors.activeAnnotation(state),
//     hoveredAnnotation: selectors.activeAnnotation(state),
//     isLoading: selectors.isLoading(state),
// })

// const mapDispatchToProps = dispatch => ({
//     setPageInfo: (url, title) => dispatch(actions.setPageInfo({ url, title })),
//     fetchAnnotations: () => dispatch(actions.fetchAnnotationAct()),
//     setAnnotationAndTags: annotations =>
//         dispatch(actions.setAnnotationAndTags(annotations)),
//     setAnnotations: annotations =>
//         dispatch(actions.setAnnotations(annotations)),
//     editAnnotation: ({ url, comment }) =>
//         dispatch(actions.editAnnotation(url, comment)),
//     deleteAnnotation: ({ url }) => dispatch(actions.deleteAnnotation(url)),
//     recieveAnchor: anchor => dispatch(commentActions.receiveAnchor(anchor)),
//     setActiveAnnotation: key => dispatch(actions.setActiveAnnotation(key)),
//     setHoveredAnnotation: key => dispatch(actions.setHoveredAnnotation(key)),
//     setHidden: value => dispatch(commentActions.setHidden(value)),
//     setIsLoading: value => dispatch(actions.setIsLoading(value)),
//     focusCommentBox: value =>
//         dispatch(commentActions.setFocusCommentBox(value)),
// })

// export default connect(
//     mapStateToProps,
//     mapDispatchToProps,
// )(SidebarContainer)

const mapStateToProps: MapStateToProps<
    StateProps,
    OwnProps,
    RootState
> = state => ({
    isOpen: selectors.isOpen(state),
    showCommentBox: commentBoxSelectors.showCommentBox(state),
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps
> = dispatch => ({
    closeSidebar: () => {
        dispatch(actions.setSidebarOpen(false))
    },
    handleAddCommentBtnClick: () => {
        dispatch(commentBoxActions.setShowCommentBox(true))
    },
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(onClickOutside(SidebarContainer))
