import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { selectors, actions } from '../redux'
import Sidebar from './Sidebar'
import Annotation from './AnnotationContainer'

import { goToAnnotation } from '../interactions'
import { setUpRemoteFunctions } from '../messaging'
import { remoteFunction } from '../../util/webextensionRPC'

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
            this.setupiFrameMessaging()
        }
    }

    setupiFrameMessaging = () => {
        setUpRemoteFunctions({
            reloadAnnotations: async () => {
                await this.props.fetchAnnotations()
            },
            sendAnchorToSidebar: anchor => {
                this.props.setAnchor(anchor)
            },
        })
    }

    handleStateChange = ({ isOpen }) => {
        if (!isOpen) this.props.setShowSidebar(false)
    }

    closeSidebar = () => {
        const { env, setShowSidebar } = this.props
        if (env === 'overview') {
            setShowSidebar(false)
        } else {
            remoteFunction('toggleSidebar')()
        }
    }

    renderAnnotations = () => {
        const annotations = this.props.annotations.sort(
            (x, y) => x.createdWhen < y.createdWhen,
        )

        return annotations.map(annotation => (
            <Annotation
                annotation={annotation}
                goToAnnotation={goToAnnotation(
                    this.props.env,
                    this.props.pageUrl,
                )}
                editAnnotation={this.props.editAnnotation}
                deleteAnnotation={this.props.deleteAnnotation}
                key={annotation.url}
                env={this.props.env}
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
                closeSidebar={this.closeSidebar}
                env={this.props.env}
            />
        )
    }
}

const mapStateToProps = state => ({
    annotations: selectors.annotations(state),
})

const mapDispatchToProps = dispatch => ({
    setPageInfo: (url, title) => dispatch(actions.setPageInfo({ url, title })),
    fetchAnnotations: () => dispatch(actions.fetchAnnotationAct()),
    editAnnotation: ({ url, comment }) =>
        dispatch(actions.editAnnotation(url, comment)),
    deleteAnnotation: ({ url }) => dispatch(actions.deleteAnnotation(url)),
    setAnchor: anchor => dispatch(actions.setAnchor(anchor)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(SidebarContainer)
