import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { selectors, actions } from '../redux'
import Sidebar from './Sidebar'
import Annotation from './AnnotationContainer'
import Loader from './Loader'

import { goToAnnotation, retryUntilErrorResolves } from '../utils'
import FrameCommunication from '../messaging'

class SidebarContainer extends React.Component {
    static propTypes = {
        showSidebar: PropTypes.bool,
        setShowSidebar: PropTypes.func,
        toggleMouseOnSidebar: PropTypes.func,
        env: PropTypes.string,
        pageUrl: PropTypes.string,
        pageTitle: PropTypes.string,
        annotations: PropTypes.array.isRequired,
        fetchAnnotations: PropTypes.func.isRequired,
        findAnnotationCount: PropTypes.func.isRequired,
        editAnnotation: PropTypes.func.isRequired,
        deleteAnnotation: PropTypes.func.isRequired,
        setAnchor: PropTypes.func.isRequired,
        setActiveAnnotation: PropTypes.func.isRequired,
        setHoveredAnnotation: PropTypes.func.isRequired,
        setAnnotations: PropTypes.func.isRequired,
        activeAnnotation: PropTypes.string.isRequired,
        hoveredAnnotation: PropTypes.string.isRequired,
        annotationCount: PropTypes.number.isRequired,
    }

    static defaultProps = {
        showSidebar: true,
        setShowSidebar: () => null,
        toggleMouseOnSidebar: () => null,
        env: 'iframe',
        pageUrl: null,
        pageTitle: null,
    }

    async componentDidMount() {
        const {
            pageTitle,
            pageUrl,
            setPageInfo,
            fetchAnnotations,
            findAnnotationCount,
        } = this.props
        setPageInfo(pageUrl, pageTitle)
        await findAnnotationCount()
        if (this.props.env === 'iframe') {
            this.setupFrameFunctions()
        } else {
            await fetchAnnotations()
        }
    }

    parentFC = new FrameCommunication()

    setupFrameFunctions = () => {
        this.parentFC.setUpRemoteFunctions({
            reloadAnnotations: async () => {
                await this.props.fetchAnnotations()
            },
            setAnnotations: annotations => {
                this.props.setAnnotations(annotations)
            },
            sendAnchorToSidebar: anchor => {
                this.props.setAnchor(anchor)
            },
            focusAnnotation: url => {
                this.focusAnnotation(url)
            },
            setHoveredAnnotation: url => {
                this.props.setHoveredAnnotation(url)
            },
        })
    }

    handleStateChange = ({ isOpen }) => {
        if (!isOpen) this.props.setShowSidebar(false)
    }

    /**
     * Takes the user to the actual higlighted text.
     */
    goToAnnotation = () => {
        return goToAnnotation(
            this.props.env,
            this.props.pageUrl,
            annotation => {
                this.props.setActiveAnnotation(annotation.url)
                this.parentFC.remoteExecute('highlightAndScroll')(annotation)
            },
        )
    }

    /**
     * Sets the annotation container active
     */
    focusAnnotation = url => {
        this.props.setActiveAnnotation(url)
        if (!url) return
        retryUntilErrorResolves(
            () => {
                const $container = document.getElementById(url)
                $container.scrollIntoView({
                    block: 'center',
                    behavior: 'smooth',
                })
            },
            { intervalMiliseconds: 200, timeoutMiliseconds: 2000 },
        )
    }

    updateAnnotations = async () => {
        await this.parentFC.remoteExecute('updateAnnotations')()
        setTimeout(() => this.focusAnnotation(this.props.activeAnnotation), 300)
    }

    deleteAnnotation = annotation => {
        if (annotation.body)
            this.parentFC.remoteExecute('deleteAnnotation')(annotation)
        this.props.deleteAnnotation(annotation)
    }

    /**
     * Makes highlight dark a little when the container is hovered
     */
    makeHighlightMedium = annotation => () => {
        if (this.props.env === 'overview') return
        this.parentFC.remoteExecute('makeHighlightMedium')(annotation)
    }

    /**
     * Removes all medium highlights
     */
    removeMediumHighlights = () => {
        if (this.props.env === 'overview') return
        this.parentFC.remoteExecute('removeMediumHighlights')()
    }

    renderAnnotations = () => {
        const { annotations, env, annotationCount } = this.props

        if (annotationCount && !annotations.length) return <Loader />

        if (env === 'overview')
            annotations.sort((x, y) => x.createdWhen > y.createdWhen)

        return annotations.map(annotation => (
            <Annotation
                annotation={annotation}
                goToAnnotation={this.goToAnnotation()}
                editAnnotation={this.props.editAnnotation}
                deleteAnnotation={this.deleteAnnotation}
                key={annotation.url}
                env={this.props.env}
                onMouseEnter={this.makeHighlightMedium}
                onMouseLeave={this.removeMediumHighlights}
                isActive={this.props.activeAnnotation === annotation.url}
                isHovered={this.props.hoveredAnnotation === annotation.url}
            />
        ))
    }

    render() {
        return (
            <Sidebar
                showSidebar={this.props.showSidebar}
                handleStateChange={this.handleStateChange}
                toggleMouseOnSidebar={this.props.toggleMouseOnSidebar}
                renderAnnotations={this.renderAnnotations}
                updateAnnotations={this.updateAnnotations}
                env={this.props.env}
            />
        )
    }
}

const mapStateToProps = state => ({
    annotations: selectors.annotations(state),
    activeAnnotation: selectors.activeAnnotation(state),
    hoveredAnnotation: selectors.activeAnnotation(state),
    annotationCount: selectors.annotationCount(state),
})

const mapDispatchToProps = dispatch => ({
    setPageInfo: (url, title) => dispatch(actions.setPageInfo({ url, title })),
    fetchAnnotations: () => dispatch(actions.fetchAnnotationAct()),
    setAnnotations: annotations =>
        dispatch(actions.setAnnotations(annotations)),
    editAnnotation: ({ url, comment }) =>
        dispatch(actions.editAnnotation(url, comment)),
    deleteAnnotation: ({ url }) => dispatch(actions.deleteAnnotation(url)),
    setAnchor: anchor => dispatch(actions.setAnchor(anchor)),
    setActiveAnnotation: key => dispatch(actions.setActiveAnnotation(key)),
    setHoveredAnnotation: key => dispatch(actions.setHoveredAnnotation(key)),
    findAnnotationCount: () => dispatch(actions.findAnnotationCount()),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(SidebarContainer)
