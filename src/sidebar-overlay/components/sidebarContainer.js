import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { selectors, actions } from '../redux'
import Sidebar from './Sidebar'
import Annotation from './AnnotationContainer'

import { goToAnnotation } from '../utils'
import FrameCommunication from '../messaging'
// import { remoteFunction } from '../../util/webextensionRPC'

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
        editAnnotation: PropTypes.func.isRequired,
        deleteAnnotation: PropTypes.func.isRequired,
        setAnchor: PropTypes.func.isRequired,
        setActiveAnnotation: PropTypes.func.isRequired,
        activeAnnotation: PropTypes.string.isRequired,
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
        const { pageTitle, pageUrl, setPageInfo, fetchAnnotations } = this.props
        setPageInfo(pageUrl, pageTitle)
        await fetchAnnotations()
        if (this.props.env === 'iframe') {
            this.setupFrameFunctions()
        }
    }

    parentFC = new FrameCommunication()

    setupFrameFunctions = () => {
        this.parentFC.setUpRemoteFunctions({
            reloadAnnotations: async () => {
                await this.props.fetchAnnotations()
            },
            sendAnchorToSidebar: anchor => {
                this.props.setAnchor(anchor)
            },
            focusAnnotation: url => {
                this.focusAnnotation(url)
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
        if (!url) return
        const $container = document.getElementById(url)
        this.props.setActiveAnnotation(url)
        $container.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }

    renderAnnotations = () => {
        const annotations = this.props.annotations.sort(
            (x, y) => x.createdWhen < y.createdWhen,
        )

        return annotations.map(annotation => (
            <Annotation
                annotation={annotation}
                goToAnnotation={this.goToAnnotation()}
                editAnnotation={this.props.editAnnotation}
                deleteAnnotation={this.props.deleteAnnotation}
                key={annotation.url}
                env={this.props.env}
                isActive={this.props.activeAnnotation === annotation.url}
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
                env={this.props.env}
            />
        )
    }
}

const mapStateToProps = state => ({
    annotations: selectors.annotations(state),
    activeAnnotation: selectors.activeAnnotation(state),
})

const mapDispatchToProps = dispatch => ({
    setPageInfo: (url, title) => dispatch(actions.setPageInfo({ url, title })),
    fetchAnnotations: () => dispatch(actions.fetchAnnotationAct()),
    editAnnotation: ({ url, comment }) =>
        dispatch(actions.editAnnotation(url, comment)),
    deleteAnnotation: ({ url }) => dispatch(actions.deleteAnnotation(url)),
    setAnchor: anchor => dispatch(actions.setAnchor(anchor)),
    setActiveAnnotation: key => dispatch(actions.setActiveAnnotation(key)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(SidebarContainer)
