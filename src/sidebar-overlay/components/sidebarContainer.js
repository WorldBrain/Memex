import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { selectors, actions } from '../redux'
import Sidebar from './Sidebar'
import Annotation from './AnnotationContainer'

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
        saveComment: PropTypes.func.isRequired,
        editAnnotation: PropTypes.func.isRequired,
        deleteAnnotation: PropTypes.func.isRequired,
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
    }

    handleStateChange = ({ isOpen }) => {
        if (!isOpen) this.props.setShowSidebar(false)
    }

    renderAnnotations = () => {
        const annotations = this.props.annotations.sort(
            (x, y) => x.createdWhen < y.createdWhen,
        )

        return annotations.map(annotation => (
            <Annotation
                annotation={annotation}
                openAnnotationURL={url => () => console.log(url)}
                editAnnotation={this.props.editAnnotation}
                deleteAnnotation={this.props.deleteAnnotation}
                key={annotation.url}
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
                saveComment={this.props.saveComment}
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
    saveComment: comment => dispatch(actions.saveComment(comment)),
    editAnnotation: ({ url, comment }) =>
        dispatch(actions.editAnnotation(url, comment)),
    deleteAnnotation: ({ url }) => dispatch(actions.deleteAnnotation(url)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(SidebarContainer)
